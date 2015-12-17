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
     * The number of frame ticks between virus insertions when the level is being generated.
     *
     * This can be a fractional number, in which case it is possible for one tick to insert more than one
     * virus; this is important since running at 30fps it takes a minimum of 2.8 seconds to insert all of
     * the viruses at one insertion per tick.
     *
     * This should probably be a sliding scale based on the level or something, as at level 20 there are a
     * lot of viruses to insert.
     *
     * @type {number}
     */
    const GENERATE_TICK = 0.5;

    /**
     * How many "units" wide the NUMBER_FONT font data points think that it is.
     *
     * @type {number}
     */
    const FONT_WIDTH = 3;

    /**
     * How many "units" tall the NUMBER_FONT font data points think that it is.
     * @type {number}
     */
    const FONT_HEIGHT = 5;

    /**
     * How many "units" should appear between consecutive NUMBER_FONT digits when they are rendered.
     *
     * @type {number}
     */
    const FONT_SPACING = 0.5;

    /**
     * This sets how big each unit in the font is when it is rendered. Thus each character in the font
     * will be FONT_WIDTH * FONT_SCALE pixels wide and FONT_HEIGHT * FONT_SCALE pixels tall. Set as
     * appropriate.
     *
     * @type {number}
     */
    const FONT_SCALE = TILE_SIZE / 2;

    /**
     * An object which maps digits into polygons that can be rendered for a simple numeric display.
     * The polygon data assumes that the top left of all of the character cells is 0,0 and that each level
     * is FONT_WIDTH x FONT_HEIGHT units in dimension.
     *
     * As such, you probably want to draw this scaled; note that when you scale the canvas, the location
     * of things rendered is scaled as well. For the purposes of our font, this works out OK.
     *
     * @type {Object<string,Polygon>}
     */
    var NUMBER_FONT = {
        "0": [['m', 0, 0], [3, 0], [3, 5], [0, 5], ['c'], ['m', 1, 1], [1, 4], [2, 4], [2, 1]],

        "1": [['m', 1, 0], [2, 0], [2, 5], [1, 5]],

        "2": [['m', 0, 0], [3, 0], [3, 3], [1, 3], [1, 4], [3, 4], [3, 5], [0, 5], [0, 2], [2, 2], [2, 1],
              [0, 1]],

        "3": [['m', 0, 0], [3, 0], [3, 5], [0, 5], [0, 4], [2, 4], [2, 3], [0, 3], [0, 2], [2, 2], [2, 1],
              [0, 1]],

        "4": [['m', 0, 0], [1, 0], [1, 2], [2, 2], [2, 0], [3, 0], [3, 5], [2, 5], [2, 3], [0, 3]],

        "5": [['m', 0, 0], [3, 0], [3, 1], [1, 1], [1, 2], [3, 2], [3, 5], [0, 5], [0, 4], [2, 4], [2, 3],
              [0, 3]],

        "6": [['m', 0, 0], [3, 0], [3, 1], [1, 1], [1, 2], [3, 2], [3, 5], [0, 5], ['c'], ['m', 1, 3], [1, 4],
              [2, 4], [2, 3]],

        "7": [['m', 0, 0], [3, 0], [3, 5], [2, 5], [2, 1], [1, 1], [1, 2], [0, 2]],

        "8": [['m', 0, 0], [3, 0], [3, 5], [0, 5], ['c'], ['m', 1, 1], [1, 2], [2, 2], [2, 1], ['c'],
              ['m', 1, 3],
              [1, 4], [2, 4], [2, 3]],

        "9": [['m', 0, 0], [3, 0], [3, 5], [0, 5], [0, 4], [2, 4], [2, 3], [0, 3], ['m', 1, 1], [1, 2],
              [2, 2],
              [2, 1]]
    };

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
         * An array of segments that we create to the left of the bottle. There is one of each possible
         * segment type stored here, which we render in a horizontal row. This is used for debug purposes
         * to show us the various entities for filling the bottle during testing.
         */
        private _segments : Array<Segment>;

        /**
         * The selected segment in the segment array above, which is the segment that a left mouse click
         * inside the bottle will insert. This gets changed via the keyboard and is visualized by the pointer.
         */
        private _segmentIndex : number;

        /**
         * This is a simple pointer entity that marks which of the segments in the segment array above is
         * currently the "selected" entity for insertion into the bottle.
         */
        private _pointer : Pointer;

        /**
         * The bottle that holds the game area.
         */
        private _bottle : Bottle;

        /**
         * The capsule that is being controlled by the player as it drops into the bottle. Once it comes
         * into contact with the bottle contents, its segments get copied to the bottle contents and we
         * then jump it back to the top of the bottle to go again.
         */
        private _capsule : Capsule;

        /**
         * The level the game is currently at. This controls things like how fast the player capsule drops
         * and also the number of viruses that get inserted into the bottle when the level starts.
         */
        private _level : number;

        /**
         * The position on the stage to render the current level number; this is calculated when the
         * scene is constructed.
         */
        private _levelTextPos : Point;

        /**
         * The number of viruses that the level starts with. This is set when a level starts generating,
         * and is based on the level. This is here because it's used during the level creation; the number
         * of viruses remaining to insert is required by the virus insertion algorithm.
         */
        private _levelVirusCount : number;

        /**
         * The position on the stage to render the current number of viruses in the bottle; this is
         * calculated when the scene is constructed.
         */
        private _virusTextPos : Point;

        /**
         * When this value is true, we are generating the virus content in the bottle.
         */
        private _generatingLevel : boolean;

        /**
         * The tick count as of the last time a virus was inserted into the bottle. We use this to slow
         * down the virus insertion
         */
        private _genTicks : number;

        /**
         * Given a string of digits, return back a point where the X value indicates how many pixels wide
         * and tall the rendered polygon for that text would be.
         *
         * @param numberStr the string to calculate the size of
         * @returns {Point} a point whose x value is the width of the string in pixels and whose y is the
         * height in pixels.
         */
        private numberStringSize (numberStr : string) : Point
        {
            // Get the height and width of a digit in our number font in pixels based on the scale factor.
            let pixelWidth = FONT_WIDTH * FONT_SCALE;
            let pixelHeight = FONT_HEIGHT * FONT_SCALE;
            let pixelGap = FONT_SPACING * FONT_SCALE;

            return new Point (numberStr.length * pixelWidth + (numberStr.length - 1) * pixelGap,
                pixelHeight);
        }

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

            // Create an array of segments that represent all of the possible segment types. We default
            // the selected segment to be the virus.
            //
            // NOTE: The code that alters the virus polygon model assumes that the elements in this list
            // are ordered by their SegmentType value.
            this._segmentIndex = 1;
            this._segments = [
                new Segment (stage, SegmentType.EMPTY, SegmentColor.BLUE),
                new Segment (stage, SegmentType.VIRUS, SegmentColor.BLUE),
                new Segment (stage, SegmentType.SINGLE, SegmentColor.BLUE),
                new Segment (stage, SegmentType.LEFT, SegmentColor.BLUE),
                new Segment (stage, SegmentType.RIGHT, SegmentColor.BLUE),
                new Segment (stage, SegmentType.TOP, SegmentColor.BLUE),
                new Segment (stage, SegmentType.BOTTOM, SegmentColor.BLUE),
            ];

            // Iterate the list of segments and set them to nice positions.
            for (let i = 0, x = TILE_SIZE / 2 ; i < this._segments.length ; i++, x += TILE_SIZE)
                this._segments[i].setStagePositionXY (x, TILE_SIZE);

            // Make the empty segment debug so that it renders visibly, and make the virus always use the
            // same polygon to start with.
            this._segments[SegmentType.EMPTY].properties.debug = true;
            this._segments[SegmentType.VIRUS].virusPolygon = 2;

            // Create our pointer pointing to the selected segment in the segment list.
            this._pointer = new Pointer (stage,
                this._segments[this._segmentIndex].position.x,
                this._segments[this._segmentIndex].position.y - TILE_SIZE);

            // Create the bottle that will hold te game board and its contents.
            this._bottle = new Bottle (stage, this, '#cccccc');

            // Create the capsule that the player controls and set its position to be at the column where
            // the opening of the bottle is, one row up from the top of the content area, so that it
            // appears to be inside the bottle opening.
            this._capsule = new Capsule (stage, this._bottle, Utils.randomIntInRange(0, 8));
            this._capsule.setMapPositionXY (this._bottle.openingXPosition, -1);

            // Calculate the size of the largest number of viruses that can appear (the number is not as
            // important as the number of digits).
            let textSize = this.numberStringSize ("99");

            // The level number text appears to the right of the bottle. We adjust down 1/2 a tile because
            // that aligns it with the top edge of the bottle, which is 1/2 a tile thick.
            this._levelTextPos = this._bottle.position.copyTranslatedXY (this._bottle.width, TILE_SIZE / 2);

            // The virus text position appears to the bottom left of the bottle, adjusted up 1/2 a tile
            // because that aligns it with the bottom edge of the bottle, which is 1/2 a tile thick.
            this._virusTextPos = this._bottle.position.copyTranslatedXY (-textSize.x,
                                                                         this._bottle.height - textSize.y -
                                                                         (TILE_SIZE / 2));

            // Now add all of our entities to ourselves. This will cause them to get updated and drawn
            // automagically.
            this.addActorArray (this._segments);
            this.addActor (this._pointer);
            this.addActor (this._bottle);
            this.addActor (this._capsule);

            // Start a new level generating.
            this.startNewLevel (20);
        }

        /**
         * Render our scene.
         *
         * Currently this method DOES NOT chain to the superclass, so it doesn't render any actors/entities.
         */
        render () : void
        {
            // Clear the canvas, then let the super render everything for us.
            this._renderer.clear ('black');
            super.render ();

            // Draw the number of viruses left in the bottle.
            this.renderNumber (this._virusTextPos.x, this._virusTextPos.y, 'white',
                               this._bottle.virusCount + "");

            // Draw the current level
            this.renderNumber (this._levelTextPos.x, this._levelTextPos.y,
                               'white', this._level + "");
        }

        /**
         * Crudely render a number using our number font.
         *
         * @param x the x position to render the top left of the number at
         * @param y the y position to render the top left of the number at
         * @param color the color to render the number
         * @param numString the string to render, which needs to be only digits.
         */
        private renderNumber (x : number, y : number, color : string, numString : string) : void
        {

            for (let i = 0 ; i < numString.length ; i++, x += (FONT_WIDTH * FONT_SCALE) + (FONT_SPACING * FONT_SCALE))
            {
                // Translate to where the number should start rendering, then scale the canvas. Since the font
                // data assumes 1 pixels per unit, the scale sets how many pixels wide each unit turns out.
                this._renderer.translateAndRotate (x, y);
                this._renderer.context.scale (FONT_SCALE, FONT_SCALE);

                var polygon = NUMBER_FONT[numString[i]];
                if (polygon)
                    this._renderer.fillPolygon (polygon, color);

                this._renderer.restore ();
            }
        }

        /**
         * Perform a frame update for our scene.
         * @param tick the game tick; this is a count of how many times the game loop has executed
         */
        update (tick : number) : void
        {
            // Let the super update our child entities
            super.update (tick);

            // Perform a virus generation step if it's been long enough to perform at least one.
            if (this._generatingLevel && tick >= this._genTicks + GENERATE_TICK)
            {
                // Keep inserting viruses until we have inserted enough for this frame.
                while (tick >= this._genTicks)
                {
                    this.virusGenerationStep ();
                    this._genTicks += GENERATE_TICK;
                }
            }
        }

        /**
         * Checks to see if the position provided is inside one of the displayed segments to the left of
         * the bottle; If so, change that segment to be the selected segment for inserting into the bottle.
         *
         * Additionally, if the click is on the virus but the virus is already the selected item, swap to
         * the next virus polygon for insertion.
         *
         * @param position the position to check
         */
        checkSegmentSelectedAtStagePosition (position : Point) : void
        {
            // Get the first and last segment in the segment display
            let first : Segment = this._segments[0];
            let last : Segment = this._segments[this._segments.length - 1];

            // Return if the point is out of bounds.
            if (position.x < first.position.x || position.y < first.position.y ||
                position.x > last.position.x + last.width ||
                position.y > last.position.y + last.height)
                return;

            // The position is in a segment, so translate it to be relative to the position of the first
            // segment and then turn it into a tile coordinate so that we can use its X value to determine
            // what the selected index is.
            position = position.copyTranslatedXY (-first.position.x, -first.position.y) .reduce (TILE_SIZE);

            // If the X is the same as the current selected index and the selected index is the virus,
            // bump its polygon.
            if (position.x == SegmentType.VIRUS && this._segmentIndex == SegmentType.VIRUS)
            {
                let poly = this._segments[SegmentType.VIRUS].virusPolygon + 1;
                if (poly == this._segments[SegmentType.VIRUS].virusPolygonCount)
                    poly = 0;
                this._segments[SegmentType.VIRUS].virusPolygon = poly;
            }

            // Make the selected index match what the position X is. We also need to move the selection
            // pointer so that we know where to draw it.
            this._segmentIndex = position.x;
            this._pointer.position.x = this._segments[this._segmentIndex].position.x;
        }

        /**
         * This triggers when a mouse click event happens.
         *
         * @param eventObj the mouse click event
         */
        inputMouseClick (eventObj : MouseEvent) : boolean
        {
            // Get the position of the mouse on the stage where the click happened.
            var mousePosition = this._stage.calculateMousePos (eventObj);

            // Get the segment at the position where the mouse was clicked. It's null if the click didn't
            // happen inside the bottle contents area.
            var segment = this._bottle.segmentAtStagePosition (mousePosition);
            if (segment != null)
            {
                // We got a segment. Copy the type, color and virus polygon from the currently selected
                // segment.
                let selected = this._segments[this._segmentIndex];

                // Copy the type, color and polygon over.
                segment.type = selected.type;
                segment.color = selected.color;
                segment.virusPolygon = selected.virusPolygon;

                // Make the bottle recalculate its virus count.
                this._bottle.debugRecountViruses ();
                return true;
            }

            // If we get here, the click is outside of the bottle. Check to see if the click is selecting
            // a segment for adding to the stage with the above code.
            this.checkSegmentSelectedAtStagePosition (mousePosition);

            // Yeah, we did a thing, even if we didn't find a segment.
            return true;
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
            switch (eventObj.keyCode)
            {
                // F5 takes a screenshot.
                case KeyCodes.KEY_F5:
                    this.screenshot ("rx", "Rx Clone Screenshot");
                    return true;

                // The C key cycles the segment color
                case KeyCodes.KEY_C:
                    let color = this._segments[0].properties.color + 1;
                    if (color > 2)
                        color = 0;
                    for (let i = 0 ; i < this._segments.length ; i++)
                        this._segments[i].color = color;
                    return true;

                // The V key cycles the virus poly for the segment with the virus.
                case KeyCodes.KEY_V:
                    let poly = this._segments[SegmentType.VIRUS].virusPolygon + 1;
                    if (poly == this._segments[SegmentType.VIRUS].virusPolygonCount)
                        poly = 0;
                    this._segments[SegmentType.VIRUS].virusPolygon = poly;
                    return true;

                // The Spacebar triggers a drop operation, which is signified by triggering with a null
                // entity
                case KeyCodes.KEY_SPACEBAR:
                    this._bottle.trigger (null);
                    return true;

                // The M key triggers a match operation, which is signified by triggering with a segment
                // entity.
                case KeyCodes.KEY_M:
                    this._bottle.trigger (this._segments[0]);
                    return true;

                // The number keys from 1 to 7 select a segment. This changes the index of the selected
                // item and also changes where the arrow is pointing.
                case KeyCodes.KEY_1:
                case KeyCodes.KEY_2:
                case KeyCodes.KEY_3:
                case KeyCodes.KEY_4:
                case KeyCodes.KEY_5:
                case KeyCodes.KEY_6:
                case KeyCodes.KEY_7:
                    this._segmentIndex = eventObj.keyCode - KeyCodes.KEY_1;
                    this._pointer.position.x = this._segments[this._segmentIndex].position.x;
                    return true;
            }

            return false;
        }

        /**
         * Given a level number in the game (which starts at 0) return back the number of viruses that
         * should be inserted into the bottle for that level number. The number of viruses maxes out after
         * a certain point when the bottle gets too full.
         *
         * @param level the level to get the virus count for
         */
        private virusesForLevel (level : number) : number
        {
            // Constrain the level to our pre defined bounds.
            if (level < 0)
                level = 0;
            if (level > 20)
                level = 20;

            // There are 4 viruses per level, plus 4.
            return (level + 1) * 4;
        }

        /**
         * Start a new level at the given level number. This will empty out the bottle and then set the
         * flag that gets us started on virus generation for the new level.
         *
         * @param level the level to start.
         */
        private startNewLevel (level : number) : void
        {
            // Empty the bottle in preparation for the new level.
            this._bottle.emptyBottle ();

            // Set the level to generate and turn on our flag that says we are generating a new level.
            this._level = level;
            this._levelVirusCount = this.virusesForLevel (this._level);
            this._generatingLevel = true;
            this._genTicks = this._stage.tick;
        }

        /**
         * The bottle invokes this whenever a match completes that removes the last of the viruses from
         * the bottle. This is our signal that it is time to start a new level.
         */
        public bottleEmpty () : void
        {
            this._level++;
            this.startNewLevel (this._level);
        }

        /**
         * This is called on a regular basis when a level is being generated to allow us to insert a new
         * virus into the bottle at the start of a level.
         *
         * This is responsible for turning off the generation flag when it's complete.
         */
        private virusGenerationStep () : void
        {
            // If the number of viruses in the bottle is the number that we want to generate, we're done.
            if (this._bottle.virusCount == this._levelVirusCount)
            {
                this._generatingLevel = false;
                return;
            }

            // Insert a virus into the bottle.
            this._bottle.insertVirus (this._level, this._levelVirusCount - this._bottle.virusCount);
        }
    }
}
