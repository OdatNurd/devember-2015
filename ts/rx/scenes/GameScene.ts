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

            // Create our pointer pointing to the selected segment in the segment list.
            this._pointer = new Pointer (stage,
                this._segments[this._segmentIndex].position.x,
                this._segments[this._segmentIndex].position.y - TILE_SIZE);

            // Create the bottle that will hold te game board and its contents.
            this._bottle = new Bottle (stage, '#cccccc');

            // Now add all of our entities to ourselves. This will cause them to get updated and drawn
            // automagically.
            this.addActorArray (this._segments);
            this.addActor (this._pointer);
            this.addActor (this._bottle);
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
        }

        /**
         * This triggers when a mouse click event happens.
         *
         * @param eventObj the mouse click event
         */
        inputMouseClick (eventObj : MouseEvent) : boolean
        {
            // Get the segment at the position where the mouse was clicked. It's null if the click didn't
            // happen inside the bottle contents area.
            var segment = this._bottle.segmentAtStagePosition (this._stage.calculateMousePos (eventObj));
            if (segment != null)
            {
                // We got a segment. Copy the type, color and virus polygon from the currently selected
                // segment.
                let selected = this._segments[this._segmentIndex];

                // Copy the type, color and polygon over.
                segment.type = selected.type;
                segment.color = selected.color;
                segment.virusPolygon = selected.virusPolygon;
            }

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
    }
}
