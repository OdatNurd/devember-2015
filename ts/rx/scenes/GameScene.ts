module nurdz.game
{
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
         * For debug purposes we display all possible segments; this is used to render them in the most
         * horrifically stupid way possible.
         */
        private _debugSegment : Segment;

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

            // Create a simple segment to use for debug rendering. The type and color don't really matter.
            this._debugSegment = new Segment (stage, SegmentType.EMPTY, SegmentColor.BLUE);

            // Fill up the bottle.
            this._bottle = [];
            for (var i = 0 ; i < BOTTLE_WIDTH * BOTTLE_HEIGHT ; i++)
            {
                // Generate random segments. This can include being empty or being a virus.
                this._bottle[i] = new game.Segment (stage,
                    Utils.randomIntInRange (0, SegmentType.SEGMENT_COUNT - 1),
                    Utils.randomIntInRange (0, 2));
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
         * Draw the debug segment at the provided X and Y location (specifying the top left of the cell in
         * which to display it), providing also the type it should render itself as and its color.
         *
         * If the type provided is virus, the virus polygon is also changed to the polygon value provided.
         *
         * @param x the X location to render at
         * @param y the Y location to render at
         * @param type the type to render as
         * @param color the color to use
         * @param poly the virus polygon to use (values between 0-2 inclusive()
         */
        private drawSegment (x : number, y : number, type : SegmentType, color : SegmentColor,
                             poly : number = 0)
        {
            // Swap the type and color, and then invoke the rendering method.
            this._debugSegment.type = type;
            if (type == SegmentType.VIRUS)
                this._debugSegment.virusPolygon = poly;
            this._debugSegment.color = color;
            this._debugSegment.render(x, y, this._renderer);
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
            this.drawSegment (32, 32, SegmentType.SINGLE, SegmentColor.BLUE);
            this.drawSegment (64, 32, SegmentType.SINGLE, SegmentColor.RED);
            this.drawSegment (96, 32, SegmentType.SINGLE, SegmentColor.YELLOW);

            this.drawSegment (32, 64, SegmentType.TOP, SegmentColor.BLUE);
            this.drawSegment (64, 64, SegmentType.TOP, SegmentColor.RED);
            this.drawSegment (96, 64, SegmentType.TOP, SegmentColor.YELLOW);

            this.drawSegment (32, 96, SegmentType.BOTTOM, SegmentColor.BLUE);
            this.drawSegment (64, 96, SegmentType.BOTTOM, SegmentColor.RED);
            this.drawSegment (96, 96, SegmentType.BOTTOM, SegmentColor.YELLOW);

            this.drawSegment (32, 128, SegmentType.LEFT, SegmentColor.BLUE);
            this.drawSegment (64, 128, SegmentType.LEFT, SegmentColor.RED);
            this.drawSegment (96, 128, SegmentType.LEFT, SegmentColor.YELLOW);

            this.drawSegment (32, 160, SegmentType.RIGHT, SegmentColor.BLUE);
            this.drawSegment (64, 160, SegmentType.RIGHT, SegmentColor.RED);
            this.drawSegment (96, 160, SegmentType.RIGHT, SegmentColor.YELLOW);

            // Throw in a virus of each color. As a hack this manually swaps the polygon around every
            // time. Dear lord. The poly remains set until changed, so we only need to cause that
            // terribleness to happen three times per frame and not 9. Yay?
            this.drawSegment (32, 192, SegmentType.VIRUS, SegmentColor.BLUE, 0);
            this.drawSegment (64, 192, SegmentType.VIRUS, SegmentColor.RED);
            this.drawSegment (96, 192, SegmentType.VIRUS, SegmentColor.YELLOW);

            this._debugSegment.virusPolygon = 1;
            this.drawSegment (32, 224, SegmentType.VIRUS, SegmentColor.BLUE, 1);
            this.drawSegment (64, 224, SegmentType.VIRUS, SegmentColor.RED);
            this.drawSegment (96, 224, SegmentType.VIRUS, SegmentColor.YELLOW);

            this._debugSegment.virusPolygon = 2;
            this.drawSegment (32, 256, SegmentType.VIRUS, SegmentColor.BLUE, 2);
            this.drawSegment (64, 256, SegmentType.VIRUS, SegmentColor.RED);
            this.drawSegment (96, 256, SegmentType.VIRUS, SegmentColor.YELLOW);


            // Draw a grid of single segments to outline where the bottle will be.
            for (var x = 0 ; x < BOTTLE_WIDTH ; x++)
            {
                for (var y = 0 ; y < BOTTLE_HEIGHT ; y++)
                {
                    // Get the segment and render it.
                    var segment = this._bottle[y * BOTTLE_WIDTH + x];
                    segment.render(x * TILE_SIZE + this._bottleXPos,
                                   y * TILE_SIZE + this._bottleYPos,
                                   this._renderer);
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
                segment.properties.type++;
                if (segment.properties.type >= SegmentType.SEGMENT_COUNT)
                    segment.properties.type = 0;
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
