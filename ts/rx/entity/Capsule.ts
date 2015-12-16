module nurdz.game
{
    export class Capsule extends Entity
    {
        /**
         * The two segments that make up our capsule. This is always an array of two segments.
         *
         * We maintain the array such that for a horizontal capsule, the first element is the left segment
         * and the second is the right, and for a vertical capsule the first element is the bottom segment
         * and the second one is the top.
         */
        private _segments : Array<Segment>;

        /**
         * Construct a new capsule.
         *
         * @param stage the stage that will be used to render this segment
         */
        constructor (stage : Stage)
        {
            // Call the super class. The only important part here is the stage. We don't care about our
            // position because something else tells us where to render, and our size is always
            // constrained by the size of tiles.
            super ("Capsule", stage, 1, 1, TILE_SIZE * 2, TILE_SIZE, 1, {});

            // Create our two segments.
            this._segments = [
                new Segment(stage, SegmentType.LEFT, SegmentColor.BLUE),
                new Segment(stage, SegmentType.RIGHT, SegmentColor.RED)
            ];
        }

        /**
         * Render our capsule at the provided stage position.
         *
         * The position provided is always the capsule "root" position, which is the top left corner of
         * the capsule when it is horizontal and the middle left side when it is verical, due to how the
         * capsule location always specifies the left or bottom segment.
         *
         * @param x the x location to render ourselves at
         * @param y the y location to render ourselves at
         * @param renderer the renderer that renders us
         */
        render (x : number, y : number, renderer : CanvasRenderer) : void
        {
            // Render the two segments.
            this._segments[0].render (x, y, renderer);
            this._segments[1].render (x + TILE_SIZE, y, renderer);
        }
    }
}
