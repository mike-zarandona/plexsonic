declare module 'colorthief' {
  export default class ColorThief {
    /**
     * Get the dominant color from an image
     * @param img - HTML image element or image URL
     * @param quality - Quality (1 = highest, 10 = default). Higher = faster but less accurate.
     * @returns RGB array [r, g, b]
     */
    getColor(img: HTMLImageElement, quality?: number): [number, number, number];

    /**
     * Get a color palette from an image
     * @param img - HTML image element
     * @param colorCount - Number of colors to return (2-10, default 10)
     * @param quality - Quality (1 = highest, 10 = default). Higher = faster but less accurate.
     * @returns Array of RGB arrays [[r, g, b], ...]
     */
    getPalette(
      img: HTMLImageElement,
      colorCount?: number,
      quality?: number
    ): Array<[number, number, number]>;
  }
}
