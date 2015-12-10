module nurdz.game
{
    /**
     * The width of the pill bottle, in pills (tiles/segments).
     *
     * @type {number}
     */
    const BOTTLE_WIDTH = 8;

    /**
     * The height of the pill bottle, in pills (tiles/segments).
     *
     * @type {number}
     */
    const BOTTLE_HEIGHT = 16;

    /**
     * This entity represents the pill bottle, which is responsible for managing the display, detecting
     * matches, and all other core game logic that relates directly the the contents of the game field.
     */
    export class Bottle extends Entity
    {
        /**
         * This holds the contents of the bottle, which is the actual game board. This is an array of
         * BOTTLE_WIDTH * BOTTLE_HEIGHT elements of the Segment entity.
         */
        private _contents : Array<Segment>;

        /**
         * Construct a new bottle. The bottle is a defined size to render the bottle image itself as well
         * as its contents, and it centers itself on the stage at an appropriate position.
         *
         * The bottle is responsible for all of the game logic that has to do with the board itself.
         *
         * @param stage the stage that will manage this entity/
         */
        constructor (stage : Stage)
        {
            // Calculate how wide the bottle is, in pixels.
            let pixelWidth = BOTTLE_WIDTH * TILE_SIZE;

            // Configure ourselves to be large and in charge. We're centered on the screen and a couple of
            // tiles from the top of the screen.
            super ("Bottle", stage, (stage.width / 2) - (pixelWidth / 2), 64, pixelWidth,
                   BOTTLE_HEIGHT * TILE_SIZE, 1, {});

            // TODO This is not creating things empty like it should
            // Fill the bottle contents with empty segments.
            this._contents = [];
            for (let i = 0 ; i < BOTTLE_WIDTH * BOTTLE_HEIGHT ; i++)
                this._contents[i] = new game.Segment (stage,
                    Utils.randomIntInRange (0, SegmentType.SEGMENT_COUNT - 1),
                    Utils.randomIntInRange (0, 2));
        }

        /**
         * Render ourselves to the screen, along with our contents
         * @param x the X location to render at
         * @param y the Y location to render at
         * @param renderer the renderer to use to render ourselves
         */
        render (x : number, y : number, renderer : CanvasRenderer)
        {
            // Let the super render our background for us
            super.render (x, y, renderer);
            for (let x = 0 ; x < BOTTLE_WIDTH ; x++)
            {
                for (let y = 0 ; y < BOTTLE_HEIGHT ; y++)
                {
                    // Get the segment and render it.
                    var segment = this._contents[y * BOTTLE_WIDTH + x];
                    segment.render (x * TILE_SIZE + this._position.x,
                                    y * TILE_SIZE + this._position.y,
                                    renderer);
                }
            }
        }

        /**
         * Given a position on the stage, this will determine if that position is inside the contents area
         * of this bottle or not. If it is, the segment that is under that position will be returned.
         * Otherwise, null is returned.
         *
         * @param stagePos the position to check
         * @returns {Segment} the segment at the provided position on the stage, or null if the position
         * is not inside the contents area of the bottle.
         */
        segmentAtStagePosition (stagePos : Point) : Segment
        {
            // If it's inside the bottle, we can do something with it.
            if (stagePos.x >= this._position.x && stagePos.y >= this._position.y &&
                stagePos.x < this._position.x + this._width &&
                stagePos.y < this._position.y + this._height)
            {
                // Convert the position to a tile by first transforming the point to be relative to the
                // origin of the screen and then constraining it to a tile dimension. We do this in a copy
                // so as to not modify the point provided to us.
                stagePos = stagePos.copyTranslatedXY (-this._position.x, -this._position.y) .reduce (TILE_SIZE);

                // Get the segment clicked on and twiddle its type.
                return this._contents[stagePos.y * BOTTLE_WIDTH + stagePos.x];
            }

            // It's out of bounds.
            return null;
        }
    }
}
