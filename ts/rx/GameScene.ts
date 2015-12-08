module nurdz.game
{
    /**
     * The different kinds of pill segments that can appear
     */
    enum SegmentType
    {
        /**
         * An empty segment; this one doesn't render at all, it's just all blank and stuff.
         */
        EMPTY,

        /**
         * A single segment; it appears as a circle and is always affected by gravity.
         */
        SINGLE,

        /**
         * One half of an existing pill. A LEFT always has a RIGHT to its right, and so on.
         *
         * Segments of this type are not susceptible to gravity unless both halves of the pill capsule are
         * free to fall.
         */
        LEFT,
        RIGHT,
        TOP,
        BOTTOM,

        /**
         * This one is not valid and only here to tell us how many segment types there are.
         */
        SEGMENT_COUNT,
    }

    /**
     * The overall size of pill segments in pixels when they are rendered. This should not be any bigger
     * than the tile size that is currently set. Ideally this is slightly smaller to provide for a margin
     * around the edge of segments when they're in the grid.
     *
     * Note that the renderer assumes that the segments are actually tile sized when it renders the parts of
     * the pill capsules that meet each other at tile boundaries (e.g. where a left meets a right).
     *
     * @type {number}
     */
    const SEGMENT_SIZE = TILE_SIZE - 2;

    /**
     * The width of the pill bottle, in pills (tiles).
     *
     * @type {number}
     */
    const BOTTLE_WIDTH = 8;

    /**
     * The height of the pill bottle, in pills (tiles).
     *
     * @type {number}
     */
    const BOTTLE_HEIGHT = 16;

    /**
     * Simple object that holds information about a segment in the grid, including it's color and segment
     * type.
     */
    interface Segment
    {
        type : SegmentType;
        color : string;
    }

    /**
     * The scene in which our game is played. This is responsible for drawing the bottle, the pills, and
     * handling the input and game logic.
     */
    export class GameScene extends Scene
    {
        /**
         * As a supreme hack, redefine the property that defines our renderer so that the compiler knows
         * that it is a canvas renderer. This allows us to get at its context so we can do things outside
         * of what the current API allows for without having to noodle with the API more.
         */
        protected _renderer : CanvasRenderer;

        /**
         * The contents of the bottle.
         */
        private _bottle : Array<Segment>;

        /**
         * The X position of the top of the bottle.
         */
        private _bottleXPos : number;

        /**
         * The Y position of the top of the bottle.
         */
        private _bottleYPos : number;

        /**
         * The width of the contents of the bottle, in pixels.
         */
        private _bottlePixelWidth : number;

        /**
         * The height of the contents of the bottle, in pixels.
         */
        private _bottlePixelHeight : number;

        /**
         * Construct a new game scene.
         *
         * @param name the name of this scene for debug purposes
         * @param stage the stage that manages this scene
         * @constructor
         */
        constructor (name : string, stage : Stage)
        {
            // Invoke the super to set up our instance.
            super (name, stage);

            // Fill up the bottle.
            this._bottle = [];
            for (var i = 0 ; i < BOTTLE_WIDTH * BOTTLE_HEIGHT ; i++)
            {
                var colors = ['red', 'yellow', 'blue'];

                this._bottle[i] = {
                    type:  Utils.randomIntInRange (0, SegmentType.SEGMENT_COUNT - 1),
                    color: colors[i % 3]
                };
            }

            // Calculate the X and Y offsets to render the bottle contents at. This tries to horizontally
            // center the contents, and shift it down a few tiles to account for the top of the bottle
            // with it's tiny mouth.
            this._bottleXPos = this._renderer.width / 2 - ((BOTTLE_WIDTH / 2) * TILE_SIZE);
            this._bottleYPos = 64;

            // Calculate the pixel dimensions of the bottle.
            this._bottlePixelWidth = BOTTLE_WIDTH * TILE_SIZE;
            this._bottlePixelHeight = BOTTLE_HEIGHT * TILE_SIZE;
        }

        /**
         * Render a segment to the screen.
         *
         * @param x the X position of the center of the location to draw the segment
         * @param y the Y position of the center of the location to draw the segment
         * @param type the type of segment to render.
         * @param color the color of the segment to draw
         */
        drawSegment (x : number, y : number, type : SegmentType, color : string)
        {
            var startAngle : number;
            var endAngle : number;

            this._renderer.fillRect(x, y, TILE_SIZE, TILE_SIZE, '#aaaaaa');

            // Modify the provided X and Y values to be the center of the cell that we're drawing into.
            x += TILE_SIZE / 2;
            y += TILE_SIZE / 2;

            // If this is a single segment, we can render it as a simple circle.
            if (type == SegmentType.SINGLE)
                this._renderer.fillCircle (x, y, SEGMENT_SIZE / 2, color);

            // If this is a single or empty segment, return now.
            if (type == SegmentType.EMPTY || type == SegmentType.SINGLE)
                return;

            // There is more work to do because we need to render a rounded segment end as well as a
            // rectangle that fills up the rest of the space.
            //
            // We are going to translate the canvas so the origin is the center of where we want to draw
            // this segment
            // We first rotate the canvas to the appropriate facing angle for the segment that we're
            // rendering, and then render assuming that the piece we are drawing is the RIGHT segment
            // (circular area on the right) as this conforms to no rotation whatsoever.
            //
            switch (type)
            {
                case SegmentType.TOP:
                    this._renderer.translateAndRotate (x, y, 270);
                    break;

                case SegmentType.BOTTOM:
                    this._renderer.translateAndRotate (x, y, 90);
                    break;

                case SegmentType.LEFT:
                    this._renderer.translateAndRotate (x, y, 180);
                    break;

                case SegmentType.RIGHT:
                    this._renderer.translateAndRotate (x, y, 0);
                    break;
            }

            // There is more work to do; we need a circular arc and also a rectangular portion.
            this._renderer.context.fillStyle = color;
            this._renderer.context.beginPath ();
            this._renderer.context.arc (0, 0, SEGMENT_SIZE / 2, Math.PI * 1.5, Math.PI / 2);
            this._renderer.context.fill ();

            // Now draw a little rectangle in the same color to fill out the pill. Note that we use
            // TILE_SIZE for the X position and the width, but the segment size for the Y position and the
            // height.
            //
            // This is on purpose; SEGMENT_SIZE represents how big the pill capsule segments should be to
            // allow for a boundary between adjacent pills, but we want the flat edge of the segments to
            // butt up against the side of their bounding boxes so that when two halves are together they
            // don't appear to have a seam.
            this._renderer.fillRect (-TILE_SIZE / 2, -SEGMENT_SIZE / 2,
                                     TILE_SIZE / 2, SEGMENT_SIZE,
                                     color);

            // Restore the translation and rotation matrix now.
            this._renderer.restore ();
        }

        /**
         * Render our scene.
         *
         * Currently this method DOES NOT chain to the superclass, so it doesn't render any actors/entities.
         */
        render ()
        {
            // Clear the canvas
            this._renderer.clear ('black');

            // Draw one of each segment type in all of our colors.
            this.drawSegment (32, 32, SegmentType.SINGLE, 'red');
            this.drawSegment (64, 32, SegmentType.SINGLE, 'blue');
            this.drawSegment (96, 32, SegmentType.SINGLE, 'yellow');

            this.drawSegment (32, 64, SegmentType.TOP, 'red');
            this.drawSegment (64, 64, SegmentType.TOP, 'blue');
            this.drawSegment (96, 64, SegmentType.TOP, 'yellow');

            this.drawSegment (32, 96, SegmentType.BOTTOM, 'red');
            this.drawSegment (64, 96, SegmentType.BOTTOM, 'blue');
            this.drawSegment (96, 96, SegmentType.BOTTOM, 'yellow');

            this.drawSegment (32, 128, SegmentType.LEFT, 'red');
            this.drawSegment (64, 128, SegmentType.LEFT, 'blue');
            this.drawSegment (96, 128, SegmentType.LEFT, 'yellow');

            this.drawSegment (32, 160, SegmentType.RIGHT, 'red');
            this.drawSegment (64, 160, SegmentType.RIGHT, 'blue');
            this.drawSegment (96, 160, SegmentType.RIGHT, 'yellow');

            // Draw a grid of single segments to outline where the bottle will be.
            for (var x = 0 ; x < BOTTLE_WIDTH ; x++)
            {
                for (var y = 0 ; y < BOTTLE_HEIGHT ; y++)
                {
                    // Get the segment and render it.
                    var segment = this._bottle[y * BOTTLE_WIDTH + x];
                    this.drawSegment (x * TILE_SIZE + this._bottleXPos,
                                      y * TILE_SIZE + this._bottleYPos,
                                      segment.type,
                                      segment.color);
                }
            }
        }

        /**
         * This triggers when a mouse click event happens.
         *
         * @param eventObj the mouse click event
         */
        inputMouseClick (eventObj : MouseEvent)
        {
            // Get the position where the mouse was clicked.
            var mousePos = this._stage.calculateMousePos (eventObj);

            // If it's inside the bottle, we can do something with it.
            if (mousePos.x >= this._bottleXPos && mousePos.y >= this._bottleYPos &&
                mousePos.x < this._bottleXPos + this._bottlePixelWidth &&
                mousePos.y < this._bottleYPos + this._bottlePixelHeight)
            {
                // Convert the mouse position to a tile by first transforming the point to be relative to
                // the origin of the screen and then constraining it to a tile dimension.
                mousePos.translateXY (-this._bottleXPos, -this._bottleYPos).reduce (TILE_SIZE);

                // Get the segment clicked on and twiddle its type.
                var segment = this._bottle[mousePos.y * BOTTLE_WIDTH + mousePos.x];
                segment.type++;
                if (segment.type >= SegmentType.SEGMENT_COUNT)
                    segment.type = 0;
            }
        }


        /**
         * This triggers when a keyboard key is pressed.
         *
         * @param eventObj the event that represents the key pressed
         *
         * @returns {boolean} true if the key was handled, false otherwise.
         */
        inputKeyDown (eventObj : KeyboardEvent) : boolean
        {
            // F5 takes a screenshot.
            if (eventObj.keyCode == KeyCodes.KEY_F5)
            {
                this.screenshot("rx", "Rx Clone Screenshot");
                return true;
            }

            return super.inputKeyDown(eventObj);
        }
    }
}
