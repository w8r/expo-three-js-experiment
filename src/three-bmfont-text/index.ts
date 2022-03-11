// @ts-ignore
import createLayout from "layout-bmfont-text";
// @ts-ignore
import createIndices from "quad-indices";

import * as vertices from "./lib/vertices";
import * as utils from "./lib/utils";
import { Box3, BufferAttribute, BufferGeometry, Sphere } from "three";
import { Font } from "./bmfont";
import { BMFontLayout, Glyph } from "./bmfont.layout";

type Options = {
  font?: Font;
  text?: string;
  size?: number;
  flipY?: boolean;
  multipage?: boolean;
  align?: "left" | "center" | "right";
  letterSpacing?: number;
  lineHeight?: number;
  tabSize?: number;
  start?: number;
  end?: number;
};

export function createTextGeometry(opt: Options) {
  return new TextGeometry(opt);
}

export class TextGeometry extends BufferGeometry {
  _opt: any;
  // @ts-ignore
  layout: BMFontLayout;
  visibleGlyphs: any;

  constructor(opts: Options) {
    super();

    // use these as default values for any subsequent
    // calls to update()
    this._opt = { ...opts };

    // also do an initial setup...
    if (opts) this.update(opts);
  }

  update(opt: Options) {
    // use constructor defaults
    opt = { ...this._opt, ...opt };

    if (!opt.font) {
      throw new TypeError("must specify a { font } in options");
    }

    this.layout = createLayout(opt);

    // get vec2 texcoords
    const flipY = opt.flipY !== false;

    // the desired BMFont data
    const font = opt.font;

    // determine texture size from font file
    const texWidth = font.common.scaleW;
    const texHeight = font.common.scaleH;

    // get visible glyphs
    const glyphs = this.layout.glyphs.filter(
      ({ data }: Glyph) => data.width * data.height > 0
    );

    // provide visible glyphs for convenience
    this.visibleGlyphs = glyphs;

    // get common vertex data
    const positions = vertices.positions(glyphs);
    const uvs = vertices.uvs(glyphs, texWidth, texHeight, flipY);
    const indices = createIndices([], {
      clockwise: true,
      type: "uint16",
      count: glyphs.length,
    });

    // update vertex data
    this.setIndex(indices);
    this.setAttribute("position", new BufferAttribute(positions, 2));
    this.setAttribute("uv", new BufferAttribute(uvs, 2));

    // update multipage data
    if (!opt.multipage && "page" in this.attributes) {
      // disable multipage rendering
      this.deleteAttribute("page");
    } else if (opt.multipage) {
      // enable multipage rendering
      const pages = vertices.pages(glyphs);
      this.setAttribute("page", new BufferAttribute(pages, 1));
    }
  }

  computeBoundingSphere() {
    if (this.boundingSphere === null) {
      this.boundingSphere = new Sphere();
    }

    const positions = this.attributes.position.array;
    const itemSize = this.attributes.position.itemSize;
    if (!positions || !itemSize || positions.length < 2) {
      this.boundingSphere.radius = 0;
      this.boundingSphere.center.set(0, 0, 0);
      return;
    }
    utils.computeSphere(positions, this.boundingSphere);
    if (isNaN(this.boundingSphere.radius)) {
      console.error(
        "THREE.BufferGeometry.computeBoundingSphere(): " +
          "Computed radius is NaN. The " +
          '"position" attribute is likely to have NaN values.'
      );
    }
  }

  computeBoundingBox() {
    if (this.boundingBox === null) {
      this.boundingBox = new Box3();
    }

    const bbox = this.boundingBox;
    const positions = this.attributes.position.array;
    const itemSize = this.attributes.position.itemSize;
    if (!positions || !itemSize || positions.length < 2) {
      bbox.makeEmpty();
      return;
    }
    utils.computeBox(positions, bbox);
  }
}
