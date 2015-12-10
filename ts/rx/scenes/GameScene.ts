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
         * For debug purposes we display all possible segments; this is used to render them in the most
         * horrifically stupid way possible.
         */
        private _debugSegment : Segment;

        /**
         * The bottle that holds the game area.
         */
        private _bottle : Bottle;

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

            // Create a bottle entity to hold the game board contents and add it as an actor so that its
            // update and render methods will get called.
            this._bottle = new Bottle (stage);
            this.addActor (this._bottle);
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
            this._debugSegment.render (x, y, this._renderer);
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

            // Invoke the super to draw the bottle for us.
            super.render ();
        }

        /**
         * This triggers when a mouse click event happens.
         *
         * @param eventObj the mouse click event
         */
        inputMouseClick (eventObj : MouseEvent)
        {
            // Get the segment at the position where the mouse was clicked. It's null if the click didn't
            // happen inside the bottle contents area.
            var segment = this._bottle.segmentAtStagePosition (this._stage.calculateMousePos (eventObj));
            if (segment != null)
            {
                segment.properties.type++;
                if (segment.properties.type >= SegmentType.SEGMENT_COUNT)
                    segment.properties.type = 0;

                if (segment.properties.type == SegmentType.VIRUS)
                    segment.virusPolygon = Utils.randomIntInRange (0, 2);
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
                this.screenshot ("rx", "Rx Clone Screenshot");
                return true;
            }

            return super.inputKeyDown (eventObj);
        }
    }
}
