module nurdz.game
{
    /**
     * This entity represents a simplistic pointer, which is just a tile sized entity that appears to
     * slowly flash and points downwards. It's used for our debug logic.
     */
    export class Pointer extends Entity
    {
        /**
         * This number increments on every update; when it hits a certain value, our color flips.
         *
         * @type {number}
         */
        private _count : number = 0;

        /**
         * The index into the color list that indicates what color to render ourselves.
         *
         * @type {number}
         */
        private _colorIndex : number = 0;

        /**
         * The list of colors that we use to display ourselves.
         *
         * @type {Array<string>}
         */
        private _colors : Array<string> = ['#ffffff', '#aaaaaa'];

        /**
         * The polygon that represents us.
         *
         * @type {Polygon}
         */
        private _poly : Polygon = [[4, 4], [TILE_SIZE - 4, 4], [TILE_SIZE / 2, TILE_SIZE - 4]];

        /**
         * Create the pointer object to be owned by the stage.
         *
         * @param stage the stage that owns this pointer
         * @param x the X location of the pointer
         * @param y the Y location of the pointer`
         */
        constructor (stage : Stage, x : number, y : number)
        {
            super ("Cursor", stage, x, y, TILE_SIZE, TILE_SIZE, 1, {});
        }

        /**
         * Called every frame to update ourselves. This causes our color to change.
         *
         * @param stage the stage that owns us.
         */
        update (stage : Stage) : void
        {
            this._count++;
            if (this._count == 7)
            {
                this._count = 0;
                this._colorIndex++;
                if (this._colorIndex == this._colors.length)
                    this._colorIndex = 0;
            }
        }

        /**
         * Render ourselves as a downward facing arrow.
         *
         * @param x the X location of where to draw ourselves
         * @param y the Y location of where to draw ourselves
         * @param renderer the renderer to use to draw ourselves
         */
        render (x : number, y : number, renderer : Renderer) : void
        {
            renderer.translateAndRotate (x, y, null);
            renderer.fillPolygon (this._poly, this._colors[this._colorIndex]);
            //renderer.fillPolygon (this._poly, 'white');
            renderer.restore ();
        }
    }
}
