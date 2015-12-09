module nurdz.game
{
    /**
     * This specifies the special structure that represents the list of points that make up a virus. This
     * allows us to ensure that we're passing the right stuff to the rendering method.
     *
     * Each of the parts is an array of points to join as a polygon. Each point is represented as an array
     * of two numbers that represent the x,y, in a clockwise order.
     *
     * Each set is rendered by first moving to the first point and then joining each successive point
     * together, back to the start point.
     */
    interface VirusPoints
    {
        /**
         * The main body of the virus; this is rendered in the virus color.
         */
        body: Array<Array<number>>;

        /**
         * The two eyes and the mouth. These are rendered in a different color than the body is, for contrast.
         */
        leftEye: Array<Array<number>>;
        rightEye: Array<Array<number>>;
        mouth: Array<Array<number>>;
    }

    /**
     * The first variant of virus.
     *
     * @type {VirusPoints}
     */
    var virusOne : VirusPoints = {
        body: [
            [21, 4], [25, 6], [28, 2], [28, 4], [27, 7], [30, 13], [30, 15], [22, 28],
            [10, 28], [2, 15], [2, 13], [5, 7], [4, 4], [4, 2], [7, 6], [11, 4]
        ],

        leftEye: [
            [12, 9], [13, 10], [13, 11], [12, 12],
            [10, 12], [9, 11], [9, 10], [10, 9]
        ],

        rightEye: [
            [23, 9], [24, 10], [24, 11], [23, 12],
            [21, 12], [20, 11], [20, 10], [21, 9]
        ],

        mouth: [
            [21, 19], [24, 18], [23, 21], [20, 23],
            [12, 23], [9, 21], [8, 18], [11, 19]
        ]
    };

    /**
     * The second variant of virus.
     *
     * @type {VirusPoints}
     */
    var virusTwo : VirusPoints = {
        body: [
            [16, 2],
            [21, 4], [23, 4], [28, 2], [28, 4], [27, 7], [30, 13], [30, 15], [27, 20], [30, 24], [25, 23], [22, 28], [20, 26],
            [12, 26], [10, 28], [7, 23], [2, 24], [5, 20], [2, 15], [2, 13], [5, 7], [4, 4], [4, 2], [9, 4], [11, 4]
        ],

        leftEye: [
            [15, 9], [16, 10], [16, 11], [15, 12],
            [10, 12], [9, 11], [9, 10], [10, 9]
        ],

        rightEye: [
            [23, 9], [24, 10], [24, 11], [23, 12],
            [18, 12], [17, 11], [17, 10], [18, 9]
        ],

        mouth: [
            [21, 19], [24, 16], [23, 21], [20, 23],
            [12, 23], [9, 21], [8, 16], [11, 19]
        ]
    };

    /**
     * The third variant of virus.
     *
     * @type {VirusPoints}
     */
    var virusThree : VirusPoints = {
        body: [
            [16, 1],
            [18, 4], [23, 4], [28, 2], [28, 4], [26, 6], [28, 13], [28, 15], [27, 20], [30, 24], [25, 23],
            [22, 30], [20, 25],
            [12, 25], [10, 30], [7, 23], [2, 24], [5, 20], [4, 15], [4, 13], [6, 6], [4, 4], [4, 2], [9, 4],
            [14, 4]
        ],

        leftEye: [
            [15, 10], [16, 11], [16, 12], [15, 13],
            [10, 12], [9, 11], [9, 10], [10, 9]
        ],

        rightEye: [
            [23, 9], [24, 10], [24, 11], [23, 12],
            [18, 13], [17, 12], [17, 11], [18, 10]
        ],

        mouth: [
            [21, 19], [24, 14], [23, 21], [20, 23], [18, 22],
            [14, 22], [12, 23], [9, 21], [8, 14], [11, 19]
        ]
    };

    /**
     * The different kinds of pill segments that can appear
     */
    enum SegmentType
    {
        /**
         * These three values (which are viruses by way of their having a negative value) represent the
         * three possible visual styles of viruses. They all behave the same and are only different to add
         * some visual variety.
         *
         * Viruses are not affected by gravity due to the magic of the little spikes on their envelopes
         * (or some such).
         */
        VIRUS_ONE = -1,
        VIRUS_TWO = -2,
        VIRUS_THREE = -3,

        /**
         * An empty segment; this one doesn't render at all, it's just all blank and stuff. As a result
         * it's also not affected by gravity because it's not there.
         */
        EMPTY = 0,

        /**
         * A single segment, this is what LEFT/RIGHT/TOP/BOTTOM turn into when the attached pill segment
         * is destroyed during a match, leaving this segment behind.
         *
         * A segment of this type is always affected by gravity if there is an empty space below it
         * because it has nothing to hold it in place.
         */
        SINGLE,

        /**
         * One half of an existing pill. A LEFT always has a RIGHT to its right, and so on.
         *
         * Segments of this type are not susceptible to gravity unless both halves of the pill capsule are
         * free to fall. For LEFT/RIGHT pairings, this is a tandem affair and we need to check an
         * additional tile, but for TOP/BOTTOM we only need to check under the BOTTOM and ignore a TOP.
         */

        /**
         * The left and right segments of a horizontal pill capsule. A LEFT always has a RIGHT on its
         * right and vice versa. When one half of the pill is destroyed, the other half turns into a SINGLE.
         *
         * These pieces are only affected by gravity if both halves have open space below them. However
         * since we do the gravity scan left to right, the RIGHT always falls when the LEFT falls, and
         * when we see a RIGHT, we ignore it.
         */
        LEFT = 2,
        RIGHT,

        /**
         * The top and bottom segments of a vertical pill capsule. a TOP always has a BOTTOM under it and
         * vice versa. When one half of the pill is destroyed, the other half turns into a SINGLE.
         *
         * Both an TOP and its attached BOTTOM are only affected by gravity if the BOTTOM has an empty
         * space below it. However, since we do the gravity scan from the bottom to the top, the TOP
         * always falls when the BOTTOM falls, and when we see a TOP, we ignore it.
         */
        TOP,
        BOTTOM,

        /**
         * This one is not valid and only here to tell us how many segment types there are, which is
         * important during debugging when we have to cycle between segments but otherwise is not
         * interesting.
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

        private drawVirusParts (x : number, y : number, points : Array<Array<number>>, color)
        {
            this._renderer.context.fillStyle = color;
            this._renderer.context.beginPath ();
            this._renderer.context.moveTo(points[0][0] + x, points[0][1] + y);
            for (var i = 1 ; i < points.length ; i++)
                this._renderer.context.lineTo(points[i][0] + x, points[i][1] + y);
            this._renderer.context.fill ();
        }

        /**
         * Render a virus at the provided location using the information in the provided virusPoint structure.
         *
         * @param x the x location to draw the virus at
         * @param y the y location to draw the virus at
         * @param vParts the specification for which virus to draw
         * @param color the color of virus to draw
         */
        private drawVirus (x : number, y : number, vParts : VirusPoints, color : string)
        {
            // The eyes and mouth of the virus will be black except when the color of the virus itself
            // is blue, in which case we render it as a gray instead, to give better contrast.
            var vColor = 'black';
            if (color == 'blue')
                vColor = '#cccccc';

            this.drawVirusParts (x, y, vParts.body, color);
            this.drawVirusParts (x, y, vParts.leftEye, vColor);
            this.drawVirusParts (x, y, vParts.rightEye, vColor);
            this.drawVirusParts (x, y, vParts.mouth, vColor);
        };

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

            switch (type)
            {
                // Nothing to draw, just return.
                case SegmentType.EMPTY:
                    return;

                // A single segment capsule is just a circle centered in the cell.
                case SegmentType.SINGLE:
                    this._renderer.fillCircle (x + (TILE_SIZE / 2), y + (TILE_SIZE / 2),
                                               SEGMENT_SIZE / 2, color);
                    return;

                // Viruses have a special call.
                case SegmentType.VIRUS_ONE:
                    this.drawVirus (x, y, virusOne, color);
                    return;

                case SegmentType.VIRUS_TWO:
                    this.drawVirus (x, y, virusTwo, color);
                    return;

                case SegmentType.VIRUS_THREE:
                    this.drawVirus (x, y, virusThree, color);
                    return;

                // The remainder of the cases are for drawing one of the four capsule segments. In order
                // to make the rendering code shorter, we translate the origin to be the center of the
                // cell for this segment and then rotate it so that we can just render a right hand
                // segment and get the result that we want.
                case SegmentType.TOP:
                    this._renderer.translateAndRotate (x + (TILE_SIZE / 2), y + (TILE_SIZE / 2), 270);
                    break;

                case SegmentType.BOTTOM:
                    this._renderer.translateAndRotate (x + (TILE_SIZE / 2), y + (TILE_SIZE / 2), 90);
                    break;

                case SegmentType.LEFT:
                    this._renderer.translateAndRotate (x + (TILE_SIZE / 2), y + (TILE_SIZE / 2), 180);
                    break;

                case SegmentType.RIGHT:
                    this._renderer.translateAndRotate (x + (TILE_SIZE / 2), y + (TILE_SIZE / 2), 0);
                    break;

            }

            // Draw the circular portion. This describes a half circle for a right hand capsule end.
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

            // Throw in a virus of each color.
            this.drawSegment (32, 192, SegmentType.VIRUS_ONE, 'red');
            this.drawSegment (64, 192, SegmentType.VIRUS_ONE, 'blue');
            this.drawSegment (96, 192, SegmentType.VIRUS_ONE, 'yellow');

            this.drawSegment (32, 224, SegmentType.VIRUS_TWO, 'red');
            this.drawSegment (64, 224, SegmentType.VIRUS_TWO, 'blue');
            this.drawSegment (96, 224, SegmentType.VIRUS_TWO, 'yellow');

            this.drawSegment (32, 256, SegmentType.VIRUS_THREE, 'red');
            this.drawSegment (64, 256, SegmentType.VIRUS_THREE, 'blue');
            this.drawSegment (96, 256, SegmentType.VIRUS_THREE, 'yellow');


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
