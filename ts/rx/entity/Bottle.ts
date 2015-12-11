module nurdz.game
{
    /**
     * The width of the pill bottle contents area, in pills (tiles/segments).
     *
     * @type {number}
     */
    const BOTTLE_WIDTH = 8;

    /**
     * The height of the pill bottle contents area, in pills (tiles/segments).
     *
     * @type {number}
     */
    const BOTTLE_HEIGHT = 16;

    /**
     * The width of the margin around the pill bottle contents area, in pills (tiles/segments). This
     * number of pill segments is added to the overall width and height of the contents area as the area
     * in which to render the actual bottle.
     *
     * As such, half of this margin appears on the left/top and the other half appears on the right/bottom.
     *
     * @type {number}
     */
    const BOTTLE_MARGIN = 2;

    /**
     * The properties that a bottle can have.
     */
    interface BottleProperties extends EntityProperties
    {
        /**
         * The color string to use to render the bottle outline.
         */
        colorStr? : string;
    }

    /**
     * This entity represents the pill bottle, which is responsible for managing the display, detecting
     * matches, and all other core game logic that relates directly the the contents of the game field.
     */
    export class Bottle extends Entity
    {
        /**
         * Redeclare our bottle properties so that it is of the correct type. This is allowed because the
         * member is protected.
         */
        protected _properties : BottleProperties;
        get properties () : BottleProperties
        { return this._properties; }

        /**
         * This holds the contents of the bottle, which is the actual game board. This is an array of
         * BOTTLE_WIDTH * BOTTLE_HEIGHT elements of the Segment entity.
         */
        private _contents : Array<Segment>;

        /**
         * The offset from our origin position that the content area of the bottle renders at.
         */
        private _contentOffset : Point;

        /**
         * The description of the polygon that describes the shape of the bottle based on the properties
         * at the time of construction.
         */
        private _bottlePolygon : Polygon;

        /**
         * Construct a new bottle. The bottle is a defined size to render the bottle image itself as well
         * as its contents, and it centers itself on the stage at an appropriate position.
         *
         * The bottle is responsible for all of the game logic that has to do with the board itself.
         *
         * @param stage the stage that will manage this entity/
         * @param color the color to render the bottle with
         */
        constructor (stage : Stage, color : string)
        {
            // Calculate the dimensions of the bottle in pixels. This is inclusive of both the margins and
            // the inner contents area.
            let width = (BOTTLE_WIDTH + BOTTLE_MARGIN) * TILE_SIZE;
            let height = (BOTTLE_HEIGHT + BOTTLE_MARGIN) * TILE_SIZE;

            // Configure ourselves to be large and in charge. We center ourselves horizontally on the
            // stage and place our bottom against the bottom of the stage.
            super ("Bottle", stage, (stage.width / 2) - (width / 2), stage.height - height,
                   width, height, 1, <BottleProperties> {colorStr: color});

            // Construct the bottle polygon for later.
            this._bottlePolygon = this.getBottlePolygon ();

            // Set up the position of the bottle contents to be half the horizontal and vertical margins
            // away from the top left corner.
            this._contentOffset = new Point ((BOTTLE_MARGIN / 2) * TILE_SIZE, (BOTTLE_MARGIN / 2) * TILE_SIZE);

            // Fill the bottle contents with empty segments.
            this._contents = [];
            for (let i = 0 ; i < BOTTLE_WIDTH * BOTTLE_HEIGHT ; i++)
                this._contents[i] = new game.Segment (stage,
                    Utils.randomIntInRange (0, SegmentType.SEGMENT_COUNT - 1),
                    Utils.randomIntInRange (0, 2));
        }

        /**
         * Given the current values for the bottle size, calculate and return a polygon that will render
         * the outline of the bottle.
         *
         * @returns {Polygon} the bottle polygon
         */
        private getBottlePolygon () : Polygon
        {
            let retVal = [];

            // Alias half of a tile, since we're going to be using that a lot.
            const halfTile = (TILE_SIZE / 2);

            // The opening in the bottle is always exactly 2 segments wide (large enough for a single pill
            // to enter it), aligned to the segment boundary, and as close to being centered as possible.
            //
            // Calculate how many segments there are to the left and right of the bottle opening. The
            // right hand side is easier to calculate because it's a simple subtraction to determine
            // what's left.
            //
            // Note that we use Math.floor here so that if the bottle is an odd number of segments wide,
            // things still work as expected.
            var leftEdgeSegments = Math.floor ((BOTTLE_WIDTH + BOTTLE_MARGIN - 2) / 2);
            var rightEdgeSegments = BOTTLE_WIDTH + BOTTLE_MARGIN - 2 - leftEdgeSegments;

            // Create an origin point.
            let point = new Point (0, 0);

            // Translate the p0int above by the values passed in, then store the new point into the return
            // value array as an array of two numbers.
            function storeOffset (xOffs : number, yOffs : number)
            {
                point.translateXY (xOffs, yOffs);
                retVal.push (point.toArray ());
            }

            // The top left corner of the exterior of the bottle starts at the center of the segment that
            // the origin is in and goes down for the entire height less one segment (because the bottle
            // walls are half a segment in thickness.
            storeOffset (halfTile, halfTile);
            storeOffset (0, (BOTTLE_HEIGHT + BOTTLE_MARGIN - 1) * TILE_SIZE);

            // Now we go across for the width less one segment and back up.
            storeOffset ((BOTTLE_WIDTH + BOTTLE_MARGIN - 1) * TILE_SIZE, 0);
            storeOffset (0, -(BOTTLE_HEIGHT + BOTTLE_MARGIN - 1) * TILE_SIZE);

            // Draw the top right side of the bottle. This requires us to move left, up, left, down and
            // right, which will end us 1/2 a tile (the thickness of the bottle walls) left and down from
            // where we started.
            storeOffset (-(rightEdgeSegments - 1) * TILE_SIZE, 0);
            storeOffset (0, -halfTile);
            storeOffset (-halfTile, 0);
            storeOffset (0, TILE_SIZE);
            storeOffset ((rightEdgeSegments - 1) * TILE_SIZE, 0);

            // Now describe the interior of the bottle walls by going down, left and back up.
            storeOffset (0, BOTTLE_HEIGHT * TILE_SIZE);
            storeOffset (-BOTTLE_WIDTH * TILE_SIZE, 0);
            storeOffset (0, -BOTTLE_HEIGHT * TILE_SIZE);

            // Now describe the top left part of the bottle in the same manner as we did to the top right,
            // only we're starting on the inside and going out instead of the other way around.
            storeOffset ((leftEdgeSegments - 1) * TILE_SIZE, 0);
            storeOffset (0, -TILE_SIZE);
            storeOffset (-halfTile, 0);
            storeOffset (0, halfTile);

            return retVal;
        }

        /**
         * This method is responsible for rendering the bottle image. This assumes that there is a total
         * margin (in tiles) or BOTTLE_MARGIN around the content area of the bottle, and that the rendering
         * of the bottle should thus take no more than (BOTTLE_MARGIN * TILE_WIDTH) / 2 pixels on each side.
         *
         * @param x the x location to render the bottle image at
         * @param y the y location to render the bottle image at
         * @param renderer the renderer to use to render the bottle.
         */
        private renderBottle (x : number, y : number, renderer : CanvasRenderer)
        {
            // Let the super render our background for us so we can determine if the bounds of the bottle
            // object are correct or not.
            //super.render (x, y, renderer);

            // Translate the canvass to our rendering position and set up to fill with our bottle color.
            renderer.translateAndRotate (x, y);
            renderer.fillPolygon (this._bottlePolygon, this._properties.colorStr);
            renderer.restore ();
        }

        /**
         * Render ourselves to the screen, along with our contents
         * @param x the X location to render at
         * @param y the Y location to render at
         * @param renderer the renderer to use to render ourselves
         */
        render (x : number, y : number, renderer : CanvasRenderer)
        {
            // Start by rendering the bottle.
            this.renderBottle (x, y, renderer);

            // Now iterate over our contents and render it out. Here we do a transform to put the origin
            // at the point on the canvas where the top left of the bottle interior is, so that we don't
            // have to do an extra translation for everything.
            renderer.translateAndRotate (x + this._contentOffset.x, y + this._contentOffset.y);
            for (let y = 0, i = 0 ; y < BOTTLE_HEIGHT ; y++)
            {
                for (let x = 0 ; x < BOTTLE_WIDTH ; x++, i++)
                {
                    // Get the segment and render it.
                    var segment = this._contents[i];
                    segment.render (x * TILE_SIZE,
                                    y * TILE_SIZE,
                                    renderer);
                }
            }

            renderer.restore ();
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
            if (stagePos.x >= this._position.x + this._contentOffset.x &&
                stagePos.y >= this._position.y + this._contentOffset.y &&
                stagePos.x < this._position.x + this._width - this._contentOffset.x &&
                stagePos.y < this._position.y + this._height - this._contentOffset.y)
            {
                // Convert the position to a tile by first transforming the point to be relative to the
                // origin of the screen and then constraining it to a tile dimension. We do this in a copy
                // so as to not modify the point provided to us.
                stagePos = stagePos.copyTranslatedXY (-this._position.x - this._contentOffset.x,
                                                      -this._position.y - this._contentOffset.y)
                    .reduce (TILE_SIZE);

                // Get the segment clicked on and twiddle its type.
                return this._contents[stagePos.y * BOTTLE_WIDTH + stagePos.x];
            }

            // It's out of bounds.
            return null;
        }
    }
}
