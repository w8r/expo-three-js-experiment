export interface Glyph {
  index: number;
  line: number;
  position: [number, number];
  data: {
    id: number;
    chnl: number;
    width: number;
    height: number;
    xoffset: number;
    yoffset: number;
    xadvance: number;
    x: number;
    y: number;
    page: number;
  };
}

export interface BMFontLayout {
  glyphs: Glyph[];
  pages: number[];
  uvs: number[];
  positions: number[];
  width: number;
  height: number;
  descender: number;
  ascender: number;
  baseline: number;
  capHeight: number;
  lineHeight: number;
  xHeight: number;
}
