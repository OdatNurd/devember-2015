module nurdz.game
{
    /**
     * This entity represents the user controllable capsule that is used to play the game and to show what
     * capsule(s) are coming next.
     *
     * This is a collection of two segments of a particular color that always arrange themselves so as to
     * be a pair of LEFT/RIGHT or TOP/BOTTOM segments.
     *
     * A capsule can be either horizontal or vertical; a horizontal capsule position is relative to it's
     * left hand side while a vertical capsule has a position relative to its bottom segment.
     *
     * In practice this means that while a horizontal capsule has a position referenced from the usual
     * origin location for entities, a vertical one actually has a position relative to the midpoint of
     * its left side.
     */
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

        private _bottle : Bottle;

        /**
         * Construct a new capsule.
         *
         * @param stage the stage that will be used to render this segment
         * @param bottle the bottle that contains us
         */
        constructor (stage : Stage, bottle : Bottle)
        {
            // Call the super class. The only important part here is the stage. We don't care about our
            // position because something else tells us where to render, and our size is always
            // constrained by the size of tiles.
            super ("Capsule", stage, 1, 1, TILE_SIZE * 2, TILE_SIZE, 1, {});

            // Save the bottle that we were provided.
            this._bottle = bottle;

            // Create our two segments. The type and color don't really matter here.
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

        /**
         * Set the stage position of this capsule; unlike the general Actor method of the same name, this
         * DOES NOT modify the map location of the capsule in any way.
         *
         * @param x the new X position on the stage
         * @param y the new Y position on the stage
         */
        setStagePositionXY (x : number, y : number) : void
        {
            // Set the stage position but otherwise do nothing; the super version of this also sets our
            // map position, which we don't want it to do.
            this._position.setToXY (x, y);
        }

        /**
         * Set the map (bottle content) position of this capsule, and then have that change be propagated
         * automatically to the stage position. This uses the bottle we were given at construction time to
         * do the conversion for us.
         *
         * This accepts negative values for both of these values, which will cause the capsule to appear
         * outside of the content area of the bottle (although still aligned to it).
         *
         * @param x the new X position in the bottle content area to set
         * @param y the new Y position in the bottle content area to set
         */
        setMapPositionXY (x : number, y : number) : void
        {
            // First, save the position as we were given it.
            this._mapPosition.setToXY (x, y);

            // Now copy this to the stage position and get the bottle to modify it to be in the correct
            // stage location/
            this._position.setToXY (x, y);
            this._bottle.translateContentPosToStage (this._position);
        }
    }
}
