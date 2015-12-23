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
    const FONT_SCALE = TILE_SIZE / 3;

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
     * This enum is used to reference the list of currently pressed keys during frame update, to see what
     * the player is doing.
     */
    enum InputKey
    {
        /**
         * Capsule movement keys.
         */
        LEFT,
        RIGHT,
        DROP,

        /**
         * Capsule rotation keys.
         */
        ROTATE_LEFT,
        ROTATE_RIGHT,

        /**
         * Placeholder to tell us how big this array is.
         */
        KEY_COUNT
    }

    /**
     * The scene in which our game is played. This is responsible for drawing the bottle, the pills, and
     * handling the input and game logic.
     */
    export class Game extends Scene
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
         * During the game, this displays under the current level number and shows you what the next
         * capsule is going to be. The properties of this capsule get copied to the main capsule and this
         * one gets randomly regenerated.
         */
        private _nextCapsule : Capsule;

        /**
         * The score for the current game.
         */
        private _score : number;

        /**
         * The position on the stage to render the current score; this is calculated when the scene is
         * constructed.
         */
        private _scoreTextPos : Point;

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
         * When this value is true, the update loop in the scene is allowed to use keyboard input to
         * modify the location of the current capsule (if possible).
         *
         * This is false when the capsule should not be controllable, such as when the level has not
         * started yet, is over, or we're waiting for a move to resolve before we allow for more control.
         */
        private _controllingCapsule : boolean;

        /**
         * As long as the capsule is controllable by the player, there is a capsule in the bottle that the
         * player is in control of. When that is the case, we need to drop the capsule down on a set
         * interval. This tracks what the tick was the last time a capsule drop happened, so that we know
         * how long until the next drop happens.
         *
         * Every time controlling capsule goes from false to true, this gets set to the current engine
         * tick, so that the next drop will happen after some interval.
         */
        private _lastDropTick : number;

        /**
         * Every time the level changes, this is set to the number of ticks that should elapse between
         * drops (when drops happen, see _lastDropTick).
         */
        private _currentDropSpeed : number;

        /**
         * Code can set this flag to indicate that the update loop should try to drop right now, even if
         * it's not time yet.
         */
        private _forceDrop : boolean;

        /**
         * The tick count as of the last time a virus was inserted into the bottle. We use this to slow
         * down the virus insertion
         */
        private _genTicks : number;

        /**
         * True when the game is over.
         */
        private _gameOver : boolean;

        /**
         * This tracks the input state of the keys that control the actual game play (i.e. this excludes
         * things like the screenshot and other debug keys).
         *
         * In use, the InputKey enum is used to index this array, with the value being false if that
         * button is not currently held down or true if it is.
         *
         * @type {Array<boolean>}
         */
        private _keys : Array<boolean>;

        /**
         * A list of created FloatingText entities that we have created and attached to our scene for the
         * purposes of displaying the score of a match; we try to reuse the items in here by finding one
         * that is currently invisible or creating a new one as needed.
         */
        private _textList : Array<FloatingText>;

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

            // We are neither generating a level nor allowing capsule control right now
            this._generatingLevel = false;
            this._controllingCapsule = false;
            this._gameOver = false;

            // Default last drop tick time and drop speed.
            this._forceDrop = false;
            this._lastDropTick = 0;
            this._currentDropSpeed = 30;

            // No score initially.
            this._score = 0;

            // Start the text list empty.
            this._textList = [];

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

            // Iterate the list of segments and set them to nice positions and also make them invisible.
            for (let i = 0, x = TILE_SIZE / 2 ; i < this._segments.length ; i++, x += TILE_SIZE)
            {
                this._segments[i].setStagePositionXY (x, TILE_SIZE * 5);
                this._segments[i].properties.visible = false;
            }

            // Make the empty segment debug so that it renders visibly, and make the virus always use the
            // same polygon to start with.
            this._segments[SegmentType.EMPTY].properties.debug = true;
            this._segments[SegmentType.VIRUS].virusPolygon = 2;

            // Create our pointer pointing to the selected segment in the segment l`ist. We also want it to
            // be invisible by default
            this._pointer = new Pointer (stage,
                this._segments[this._segmentIndex].position.x,
                this._segments[this._segmentIndex].position.y - TILE_SIZE,
                90);
            this._pointer.properties.visible = false;

            // Create the bottle that will hold te game board and its contents.
            this._bottle = new Bottle (stage, this, '#cccccc');

            // Create the capsule that the player controls and set its position to be at the column where
            // the opening of the bottle is, one row up from the top of the content area, so that it
            // appears to be inside the bottle opening.
            this._capsule = new Capsule (stage, this._bottle, Utils.randomIntInRange (0, 8));
            this._capsule.setMapPositionXY (this._bottle.openingXPosition, -1);

            // The level number text appears to the right of the bottle. We adjust down 1/2 a tile because
            // that aligns it with the top edge of the bottle, which is 1/2 a tile thick.
            this._levelTextPos = this._bottle.position.copyTranslatedXY (this._bottle.width, TILE_SIZE / 2);

            // Calculate the size of the largest number of viruses that can appear (the number is not as
            // important as the number of digits).
            let textSize = this.numberStringSize ("99");

            // The virus text position appears to the bottom left of the bottle, adjusted up 1/2 a tile
            // because that aligns it with the bottom edge of the bottle, which is 1/2 a tile thick.
            this._virusTextPos = this._bottle.position.copyTranslatedXY (-textSize.x,
                                                                         this._bottle.height - textSize.y -
                                                                         (TILE_SIZE / 2));

            // Now calculate the size of the largest score that can appear.
            textSize = this.numberStringSize ("999999");

            // The score position appears to the top left of the bottle, adjusted down 1/2 a tile because
            // that aligns it with the top edge of the bottom, which is 1/2 a tile thick.
            this._scoreTextPos = this._bottle.position.copyTranslatedXY (-textSize.x, (TILE_SIZE / 2));

            // Create the capsule that shows us what the upcoming capsule is going to be, and place it
            // below the level text. It starts off hidden
            this._nextCapsule = new Capsule (stage, this._bottle, Utils.randomIntInRange (0, 8));
            this._nextCapsule.properties.visible = false;
            this._nextCapsule.setStagePosition (this._levelTextPos.copy ());
            this._nextCapsule.position.translateXY (0, (FONT_HEIGHT * FONT_SCALE) + TILE_SIZE);

            // Set up the key state. We assume that all keys are not pressed at startup.
            this._keys = [];
            for (let i = 0 ; i < InputKey.KEY_COUNT ; i++)
                this._keys[i] = false;

            // Now add all of our entities to ourselves. This will cause them to get updated and drawn
            // automagically.
            this.addActorArray (this._segments);
            this.addActor (this._pointer);
            this.addActor (this._bottle);
            this.addActor (this._capsule);
            this.addActor (this._nextCapsule);

            // Start a new level generating.
            this.startNewLevel (10);
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

            // If the game is not over, render the number of viruses in the bottle.
            if (this._gameOver == false)
                this.renderNumber (this._virusTextPos.x, this._virusTextPos.y, 'white',
                                   this._bottle.virusCount + "");

            // Draw the current level; this always happens so you know what level you bailed at.
            this.renderNumber (this._levelTextPos.x, this._levelTextPos.y,
                               'white', this._level + "");

            // Draw the score. This also always happens.
            this.renderNumber (this._scoreTextPos.x, this._scoreTextPos.y, 'white', this._score + "");
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

            // If we're allowed, see what the user wants to do with the capsule. We want to constrain
            // movements to not happen too often.
            if (this._controllingCapsule)
            {
                // First, let te player try to manipulate the capsule. If we're about to drop the capsule,
                // this is their "last chance" to do something.
                //
                // This is important because the drop key will drop the capsule all the way and then rely
                // on the code below to handle it.
                this.controlCapsule ();

                // If enough time has passed, attempt to drop the capsule.
                if (tick >= this._lastDropTick + this._currentDropSpeed || this._forceDrop)
                {
                    // Make sure the force drop flag is no longer set.
                    this._forceDrop = false;

                    // Count this tick as the tick that the drop happened at.
                    this._lastDropTick = tick;

                    // Try to drop the capsule. If this doesn't work, we can't move down any more from where
                    // we are.
                    if (this._capsule.drop () == false)
                    {
                        // If the capsule is currently still outside the bottle, then the bottle is all filled
                        // up, and so the game is now over.
                        if (this._capsule.mapPosition.y < 0)
                        {
                            this.gameOver ();
                            return;
                        }

                        // Just a normal capsule drop; make the capsule invisible and stop the user from being
                        // able to control it.
                        this._capsule.properties.visible = false;
                        this._controllingCapsule = false;

                        // Now apply the capsule to the bottle contents and trigger the bottle to see if this
                        // formed a match or not.
                        this._capsule.apply ();
                        this._bottle.trigger ();
                    }
                }

            }
        }

        /**
         * Check to see if the capsule is being moved by the player. If it is, and the move is allowed, go
         * ahead and do it.
         */
        private controlCapsule () : void
        {
            if (this._keys[InputKey.DROP])
            {
                this._keys[InputKey.DROP] = false;

                // Tell the update loop to force a drop.
                this._forceDrop = true;
            }
            else if (this._keys[InputKey.LEFT])
            {
                this._keys[InputKey.LEFT] = false;
                this._capsule.slide (true);
            }
            else if (this._keys[InputKey.RIGHT])
            {
                this._keys[InputKey.RIGHT] = false;
                this._capsule.slide (false);
            }
            else if (this._keys[InputKey.ROTATE_LEFT])
            {
                this._keys[InputKey.ROTATE_LEFT] = false;
                this._capsule.rotate (true);
            }
            else if (this._keys[InputKey.ROTATE_RIGHT])
            {
                this._keys[InputKey.ROTATE_RIGHT] = false;
                this._capsule.rotate (false);
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
            // If the pointer is not visible, debug mode is not enabled, so clicks do nothing, so ignore
            // the event.
            if (this._pointer.properties.visible == false)
                return false;

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
         * Handle a key press or release event by marking the key array boolean as appropriate given the
         * event.
         *
         * @param keyCode the key code of the key that was pressed or released
         * @param pressed true if this was a key press event or false otherwise
         * @returns {boolean} true if keyCode was an input key that we cared about or false otherwise
         */
        handleGameKey (keyCode : number, pressed : boolean) : boolean
        {
            // Store the state of the given key code and return true if this is one we care about.
            switch (keyCode)
            {
                // These are the keys that control the actual game play.
                case KeyCodes.KEY_LEFT:
                    this._keys[InputKey.LEFT] = pressed;
                    return true;

                case KeyCodes.KEY_RIGHT:
                    this._keys[InputKey.RIGHT] = pressed;
                    return true;

                case KeyCodes.KEY_DOWN:
                    this._keys[InputKey.DROP] = pressed;
                    return true;

                case KeyCodes.KEY_Z:
                    this._keys[InputKey.ROTATE_LEFT] = pressed;
                    return true;

                case KeyCodes.KEY_X:
                    this._keys[InputKey.ROTATE_RIGHT] = pressed;
                    return true;
            }

            // We care not.
            return false;
        }

        /**
         * Toggle debug state for the game. This makes various controls visible or not visible, which also
         * controls.
         */
        private toggleDebugState () : void
        {
            // Toggle the visibility of the pointer and all segments.
            this._pointer.properties.visible = !this._pointer.properties.visible;
            for (let i = 0 ; i < this._segments.length ; i++)
                this._segments[i].properties.visible = !this._segments[i].properties.visible;

            // If we are in debug mode, set the drop rate to an insane value to halt things; otherwise,
            // set it to the appropriate value.
            if (this._pointer.properties.visible)
                this._currentDropSpeed = 99999;
            else
                this._currentDropSpeed = this.dropSpeedForLevel (this._level);
        }

        /**
         * This triggers when a keyboard key is released.
         *
         * @param eventObj the event that represents the key released
         * @returns {boolean} true if the key was handled, false otherwise
         */
        inputKeyUp (eventObj : KeyboardEvent) : boolean
        {
            // We only need to handle game keys here.
            return this.handleGameKey (eventObj.keyCode, false);
        }

        /**
         * This triggers when a keyboard key is pressed.
         *
         * @param eventObj the event that represents the key pressed
         * @returns {boolean} true if the key was handled, false otherwise.
         */
        inputKeyDown (eventObj : KeyboardEvent) : boolean
        {
            // If this is a key that is used to control the game, then this will handle it and return
            // true, in which case we're done./
            if (this.handleGameKey (eventObj.keyCode, true))
                return true;

            // Check other keys
            switch (eventObj.keyCode)
            {
                // F1 toggles debug mode on and off.
                case KeyCodes.KEY_F1:
                    this.toggleDebugState ();
                    return true;

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
         * Given a level number in the game (which starts at 0) return back how many frame ticks should
         * occur between drops.
         *
         * As implemented currently, this makes all of the drops on any level be a uniform speed. In the
         * actual NES version of the game, this was a sliding scale; every 10 capsules the speed would
         * increase a little bit, and there was also an initial "low/medium/high" for speed selection.
         *
         * In this crude prototype, we don't go to that trouble.
         *
         * @param level the level to check
         * @returns {number} how many ticks should occur between natural drops.
         */
        private dropSpeedForLevel (level : number) : number
        {
            const baseSpeedList = [30, 30, 30, 25, 25,
                                   25, 20, 20, 20, 15,
                                   15, 12, 12, 12, 12,
                                   12, 11, 11, 10, 8, 8];

            // Make sure if the level is out of range, we constrain.
            if (level < 0)
                return baseSpeedList[0];
            if (level >= baseSpeedList.length)
                return baseSpeedList[baseSpeedList.length - 1];

            // Return the index from the table
            return baseSpeedList[level];
        }

        /**
         * Start a new level at the given level number. This will empty out the bottle and then set the
         * flag that gets us started on virus generation for the new level.
         *
         * @param level the level to start.
         */
        private startNewLevel (level : number) : void
        {
            // Make sure the game is no longer over.
            this._gameOver = false;

            // Empty the bottle in preparation for the new level and hide the user controlled capsule and
            // the next capsule.
            this._bottle.emptyBottle ();
            this._capsule.properties.visible = false;
            this._nextCapsule.properties.visible = false;
            this._controllingCapsule = false;

            // Set the level to generate and turn on our flag that says we are generating a new level.
            this._level = level;
            this._currentDropSpeed = this.dropSpeedForLevel (this._level);
            this._levelVirusCount = this.virusesForLevel (this._level);
            this._generatingLevel = true;
            this._genTicks = this._stage.tick;
        }

        /**
         * Restart the game by setting all state back to how it originally started, and then regenerate
         * the level we currently have set.
         */
        restartGame () : void
        {
            this.startNewLevel (this._level);
        }

        /**
         * This gets invoked when the scene detects that the game is over; the user controlled capsule could
         * not drop down, but it was still outside the bottle, which means that everything is too blocked up
         * to continue.
         */
        private gameOver () : void
        {
            // Game is over now.
            this._gameOver = true;

            // Empty the bottle, hide the user capsule, and stop the user from controlling it.
            this._bottle.emptyBottle ();
            this._capsule.properties.visible = false;
            this._nextCapsule.properties.visible = false;
            this._controllingCapsule = false;

            // Switch to the game over scene.
            this._stage.switchToScene ("gameOver");
        }

        /**
         * Get or create a floating text object and configure it for displaying the score value provided
         * with the given initial position.
         *
         * The returned object is fully configured with defaults, so further customization can be done but
         * is not needed.
         *
         * This draws from a pool of created objects and creates new ones as needed.
         *
         * @param score the score value to display
         * @param position the position to draw the text at initially
         * @returns {FloatingText} the configured text object
         */
        private textObjectForScore (score : number, position : Point) : FloatingText
        {
            let textObj = null;

            // Scan over the list of text objects trying to find one that is not currently visible, so
            // that we can reuse it.
            for (let i = 0 ; i < this._textList.length ; i++)
            {
                if (this._textList[i].properties.visible == false)
                {
                    textObj = this._textList[i];
                    break;
                }
            }

            // If we didn't find one, we need to create one.
            if (textObj == null)
            {
                // Create it, then add it to the stage and to the array.
                textObj = new FloatingText (this._stage, 0, 0, "");

                this.addActor (textObj);
                this._textList.push (textObj);
            }

            // Set the text and position of the object.
            textObj.text = score + "";
            textObj.position.setTo (position);

            // Now give it a life, a speed, and make it visible.
            textObj.properties.speed = Utils.randomIntInRange (1, 3);
            textObj.properties.life = Utils.randomIntInRange (25, 35);
            textObj.properties.visible = true;

            // Return it now.
            return textObj;
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
         * The bottle invokes this whenever a match or drop completes but there are still viruses left in
         * the bottle.
         */
        public dropComplete () : void
        {
            // Set the user capsule back to the top of the bottle and make sure that it's horizontal.
            this._capsule.setMapPositionXY (this._bottle.openingXPosition, -1);
            this._capsule.properties.orientation = CapsuleOrientation.HORIZONTAL;

            // Copy the type from the next capsule to the current capsule, then regenerate the next capsule.
            this._capsule.properties.type = this._nextCapsule.properties.type;
            this._nextCapsule.properties.type = Utils.randomIntInRange (0, 8);

            // Make both capsules update their segments, so that they visually represent properly.
            this._capsule.updateSegments ();
            this._nextCapsule.updateSegments ();

            // Now we can make both capsules visible and let the user gain control again.
            this._capsule.properties.visible = true;
            this._nextCapsule.properties.visible = true;
            this._controllingCapsule = true;

            // Reset the last time the capsule naturally dropped to right this second, so that there is a
            // delay before the new one drops on its own.
            this._lastDropTick = this._stage.tick;
        }

        /**
         * The bottle invokes this whenever a match of any sort is made (but before it is removed from the
         * screen; at the point of this callback the matched segments are still on display).
         *
         * We get told the number of viruses that were removed as a part of this match (which may be 0),
         * as well as what part of the cascade chain this is.
         *
         * The chain starts at 0 for the first match made after a capsule is initially dropped by the player,
         * then 1 for the match that happens when those segments are removed and fall down, and so on.
         *
         * @param virusesRemoved the number of viruses removed by this match (may be 0)
         * @param cascadeLength the part of the cascade chain that this is (first is 0, then 1, etc). This
         * is always 0 for the first match made after the initial capsule drop and then 1 for every match
         * @param matchPoint a point in stage position that represents the center of the area that the
         * match happened.
         */
        public matchMade (virusesRemoved : number, cascadeLength : number, matchPoint : Point) : void
        {
            const PER_VIRUS_SCORE = 200;
            const CASCADE_MULTIPLIER_BONUS = [1, 2, 2.5, 3];

            // Constrain the cascade length to the maximum allowable bonus.
            if (cascadeLength >= CASCADE_MULTIPLIER_BONUS.length)
                cascadeLength = CASCADE_MULTIPLIER_BONUS.length - 1;

            // The score awarded for this match. There is a score awarded per virus clobbered in a single
            // match, but multiples are worth more. In particular, the first virus is worth PER_VIRUS_SCORE,
            // and the second one is worth twice that PLUS the value for the first one.
            let scoreThisMatch = 0;
            while (virusesRemoved > 0)
            {
                scoreThisMatch += (virusesRemoved * PER_VIRUS_SCORE);
                virusesRemoved--;
            }

            // Now, based on the cascade length, multiply the score for this match.
            scoreThisMatch *= CASCADE_MULTIPLIER_BONUS[cascadeLength];

            // If there was a score increase, update our score variable and then display how much this
            // match was for.
            if (scoreThisMatch > 0)
            {
                this._score += scoreThisMatch;
                this.textObjectForScore (scoreThisMatch, matchPoint);
            }
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
                // Turn off the flag and then show the user capsule, we're ready to play.
                this._generatingLevel = false;
                this.dropComplete ();
                return;
            }

            // Insert a virus into the bottle.
            this._bottle.insertVirus (this._level, this._levelVirusCount - this._bottle.virusCount);
        }
    }
}
