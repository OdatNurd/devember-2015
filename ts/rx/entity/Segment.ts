module nurdz.game
{
    /**
     * This represents the different kinds of segments that there can be. The segment type controls how a
     * segment visually displays itself to the screen and how it interacts with other segments in the bottle.
     */
    export enum SegmentType
    {
        /**
         * An empty segment; this one doesn't render at all, it's just all blank and stuff. As a result
         * it's also not affected by gravity because it's not there.
         */
        EMPTY,

        /**
         * This segment is a virus. A virus is never subject to gravity and just remains suspended in the
         * bottle until it gets destroyed during the game by matching. Presumably this is due to the magic
         * of the spikes they have on their envelopes.
         */
        VIRUS,

        /**
         * A simple capsule segment. This is what LEFT/RIGHT/TOP/BOTTOM turn into when their other attached
         * segment is destroyed during the game, leaving a single segment behind (hence the name).
         *
         * A segment of this type is always affected by gravity if there is an empty space below it because
         * it has nothing to hold it in place.
         */
        SINGLE,

        /**
         * These two segments types represent the left and right segments of a horizontal pill capsule. A
         * LEFT always has a RIGHT on its right and vice versa. When one half of the pill is destroyed, the
         * other half turns into a SINGLE.
         *
         * These pieces are only affected by gravity if both halves have open space below them. In this case,
         * both halves drop during the save movement. Since we do the gravity scan left to right, the RIGHT
         * always falls when the LEFT falls, so when we see a RIGHT, we skip over it and consider it
         * already handled.
         */
        LEFT = 2,
        RIGHT,

        /**
         * These two segment types represent the top and bottom segments of a vertical pill capsule. A TOP
         * always has a BOTTOM under it and vice versa. When one half of the pill is destroyed, the other
         * half turns into a SINGLE.
         *
         * Both the TOP and its attached BOTTOM are only affected by gravity if the BOTTOM has an empty space
         * below it. In this case, both halves drop during the same movement. Since we do the gravity scan
         * from the bottom to the top, the TOP always falls when the BOTTOM falls, so when we see a TOP, we
         * skip over it and consider it already handled.
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
     * This controls the color that a segment renders as, as one of the three possible values.
     */
    export enum SegmentColor
    {
        /**
         * The segment renders in the blue (chill) color.
         */
        BLUE,

        /**
         * The segment renders in the red (fever) color.
         */
        RED,

        /**
         * Te segment renders in the yellow (???) color.
         */
        YELLOW,
    }

    /**
     * The colors to use when rendering the segments. This is meant to be indexed by an instance of
     * SegmentColor, so make sure that the order of things line up (including having the correct number of
     * items) unless you want things to not work.
     *
     * @type {Array<string>}
     */
    const RENDER_COLORS = ['#0033cc', '#cc3300', '#cccc00'];

    /**
     * The overall size of segments in pixels when they are rendered. This should not be any bigger than the
     * tile size that is currently set. Ideally this is slightly smaller to provide for a margin around the
     * edge of segments when they're in the grid.
     *
     * Note that the renderer assumes that the segments are actually tile sized when it renders the parts of
     * the pill capsules that meet each other at tile boundaries (e.g. where a left meets a right) so that
     * the two halves can meet without seams along their center.
     * @type {number}
     */
    const SEGMENT_SIZE = TILE_SIZE - 2;

    /**
     * This specifies the special structure that represents the list of points that make up a virus. This
     * doesn't actually generate any code, but it does tell the TypeScript compiler what we expect the
     * data structure to look like so that it can do compile time checks for us.
     *
     * All of the points in the array are stored as an array of two elements, of which the first element
     * is the X and the second element is the Y.
     *
     * Each of the parts is an array of such points, which should be in clockwise order and are joined
     * together to form a polygon.
     *
     * All point coordinates assumes that the top left of the cell in which they will be rendered is 0, 0
     * so they are essentially offsets.
     *
     * Note that nothing in here stops the values in the array from being smaller than 0 or bigger than
     * TILE_SIZE except for how terrible that will look at run time.
     */
    type PointArray = Array<Array<number>>;
    interface VirusPoints
    {
        /**
         * The main body of the virus; this is rendered in the virus color.
         */
        body: PointArray;

        /**
         * The two eyes and the mouth. These are rendered in a different color than the body is, for contrast.
         */
        leftEye: PointArray;
        rightEye: PointArray;
        mouth: PointArray;
    }

    /**
     * The first variant of virus.
     *
     * @type {VirusPoints}
     */
    const virusOne : VirusPoints = {
        body: [
            [21, 4], [25, 6], [28, 2], [28, 4], [27, 7], [30, 13], [30, 15], [22, 28], [10, 28], [2, 15],
            [2, 13], [5, 7], [4, 4], [4, 2], [7, 6], [11, 4]
        ],

        leftEye: [
            [12, 9], [13, 10], [13, 11], [12, 12], [10, 12], [9, 11], [9, 10], [10, 9]
        ],

        rightEye: [
            [23, 9], [24, 10], [24, 11], [23, 12], [21, 12], [20, 11], [20, 10], [21, 9]
        ],

        mouth: [
            [21, 19], [24, 18], [23, 21], [20, 23], [12, 23], [9, 21], [8, 18], [11, 19]
        ]
    };

    /**
     * The second variant of virus.
     *
     * @type {VirusPoints}
     */
    const virusTwo : VirusPoints = {
        body: [
            [16, 2], [21, 4], [23, 4], [28, 2], [28, 4], [27, 7], [30, 13], [30, 15], [27, 20], [30, 24],
            [25, 23], [22, 28], [20, 26], [12, 26], [10, 28], [7, 23], [2, 24], [5, 20], [2, 15], [2, 13],
            [5, 7], [4, 4], [4, 2], [9, 4], [11, 4]
        ],

        leftEye: [
            [15, 9], [16, 10], [16, 11], [15, 12], [10, 12], [9, 11], [9, 10], [10, 9]
        ],

        rightEye: [
            [23, 9], [24, 10], [24, 11], [23, 12], [18, 12], [17, 11], [17, 10], [18, 9]
        ],

        mouth: [
            [21, 19], [24, 16], [23, 21], [20, 23], [12, 23], [9, 21], [8, 16], [11, 19]
        ]
    };

    /**
     * The third variant of virus.
     *
     * @type {VirusPoints}
     */
    const virusThree : VirusPoints = {
        body: [
            [16, 1], [18, 4], [23, 4], [28, 2], [28, 4], [26, 6], [28, 13], [28, 15], [27, 20], [30, 24],
            [25, 23], [22, 30], [20, 25], [12, 25], [10, 30], [7, 23], [2, 24], [5, 20], [4, 15], [4, 13],
            [6, 6], [4, 4], [4, 2], [9, 4], [14, 4]
        ],

        leftEye: [
            [15, 10], [16, 11], [16, 12], [15, 13], [10, 12], [9, 11], [9, 10], [10, 9]
        ],

        rightEye: [
            [23, 9], [24, 10], [24, 11], [23, 12], [18, 13], [17, 12], [17, 11], [18, 10]
        ],

        mouth: [
            [21, 19], [24, 14], [23, 21], [20, 23], [18, 22], [14, 22], [12, 23], [9, 21], [8, 14], [11, 19]
        ]
    };

    interface SegmentProperties extends EntityProperties
    {
        /**
         * The segment type. This is used for game logic and for rendering.
         */
        type? : SegmentType;

        /**
         * The color of this segment. This is a value that allows for comparisons and is used to set up
         * the colorStr member; this one is not used directly in rendering.
         */
        color? : SegmentColor;

        /**
         * When the segment type is a virus, this represents the polygon that should be used to render it.
         */
        poly? : VirusPoints;

        /**
         * The color specification to be used for this segment when it is rendered. This is set from the
         * color member.
         */
        colorStr? : string;
    }

    /**
     * Everything that can be rendered inside of the bottle in the game is a segment of some sort, be it a
     * capsule portion, a virus or even just empty space.
     */
    export class Segment extends Entity
    {
        /**
         * Redeclare our segment properties so that it is of the correct type. This is allowed because the
         * member is protected.
         */
        protected _properties : SegmentProperties;
        get properties () : SegmentProperties
        { return this._properties; }

        /**
         * Change the polygon used to render this segment when it is rendered as a virus.
         *
         * @param poly a value in the range of 0 to 2 inclusive, to select the appropriate virus polygon.
         * Out of range values are treated as 0.
         */
        set virusPolygon (poly : number)
        {
            let polyArray = [virusOne, virusTwo, virusThree];
            if (poly < 0 || poly > 2)
                poly = 0;
            this._properties.poly = polyArray[poly];
        }

        /**
         * Change the segment type of this segment to be the new type.
         * @param type
         */
        set type (type : SegmentType)
        { this._properties.type = type; }

        /**
         * Change the segment color of this segment to be the new color.
         */
        set color (color : SegmentColor)
        {
            this._properties.color = color;
            this._properties.colorStr = RENDER_COLORS[color];
        }

        /**
         * Construct a new segment
         *
         * @param stage the stage that will be used to render this segment
         * @param type the type of segment that this should be
         * @param color the color of this segment when rendered
         */
        constructor (stage : Stage, type : SegmentType, color : SegmentColor)
        {
            // Call the super class. The only important part here is the stage. We don't care about our
            // position because something else tells us where to render, and our size is always
            // constrained by the size of tiles.
            //
            // Here we set the type and color parameters directly into our properties.
            super ("Segment", stage, 1, 1, TILE_SIZE, TILE_SIZE, 1, <SegmentProperties> {
                type:  type,
                color: color
            }, {}, '#909090');

            // If this is a virus, we need to set the polygon too.
            if (type == SegmentType.VIRUS)
                this.virusPolygon = Utils.randomIntInRange(0, 2);

            // Lastly, we need to set up the color string based on the color specification we were given.
            this._properties.colorStr = RENDER_COLORS[this._properties.color];
        }

        /**
         * Render the point array provided as a polygon filled with the provided color. The passed in data
         * should be an array of points (stored as an array of two numbers in x, y order) that wind in a
         * clockwise manner. The last point will be implicitly joined to the first point.
         *
         * This call assumes that the points passed in are in a 0 based origin and that the underlying canvas
         * has been translated to put the origin at the upper left corner of where the polygon should
         * actually be rendered.
         *
         * @param renderer the renderer to render the polygon with.
         * @param points the point array to render as a polygon
         * @param color the color to fill with
         */
        private fillPolygon (renderer : CanvasRenderer, points : PointArray, color : string)
        {
            // Set the color and begin our polygon.
            renderer.context.fillStyle = color;
            renderer.context.beginPath ();

            // Use the first point to start the polygon, then join the rest of the points together in turn.
            renderer.context.moveTo(points[0][0], points[0][1]);
            for (let i = 1 ; i < points.length ; i++)
                renderer.context.lineTo(points[i][0], points[i][1]);

            // FIll the shape now. This closes the shape by connecting the start and end point for us.
            renderer.context.fill ();
        }

        /**
         * Render ourselves as a virus using the virus polygon provided. This assumes that the rendering
         * context has already been translated to put the origin at the top left corner of the cell to render
         * the virus into.
         *
         * @param renderer the renderer to render the virus with
         */
        private renderVirus (renderer : CanvasRenderer)
        {
            // The eyes and mouth of the virus will be black except when the color of the virus itself
            // is blue, in which case we render it as a gray instead, to give better contrast.
            var vColor = '#000000';
            if (this._properties.color == SegmentColor.BLUE)
                vColor = '#cccccc';

            // Render out all of the polygons now.
            this.fillPolygon (renderer, this._properties.poly.body, this._properties.colorStr);
            this.fillPolygon (renderer, this._properties.poly.leftEye, vColor);
            this.fillPolygon (renderer, this._properties.poly.rightEye, vColor);
            this.fillPolygon (renderer, this._properties.poly.mouth, vColor);
        };

        /**
         * Render ourselves as a capsule segment of some sort. This assumes that the rendering context has
         * already been translated to put the origin in the center of the cell that we are supposed to
         * render into, and that it has also been rotated to make the capsule segment we render (a RIGHT)
         * appear correctly.
         *
         * @param renderer the renderer to render the capsule segment with
         */
        private renderCapsuleSegment (renderer : CanvasRenderer)
        {
            // How we render depends on our type.
            switch (this._properties.type)
            {
                // A single segment capsule is just a circle centered in the cell.
                case SegmentType.SINGLE:
                    renderer.fillCircle (0, 0, SEGMENT_SIZE / 2, this._properties.colorStr);
                    return;

                // The remainder of the cases are (or should be) one of the four capsule segments that are
                // meant to be joined together to be a single capsule. This always renders as a right
                // handed segment because we assume the canvas has been rotated as appropriate.
                default:
                    // Draw the circular portion. This describes a half circle for a right hand capsule end.
                    renderer.context.fillStyle = this._properties.colorStr;
                    renderer.context.beginPath ();
                    renderer.context.arc (0, 0, SEGMENT_SIZE / 2, Math.PI * 1.5, Math.PI / 2);
                    renderer.context.fill ();

                    // Now draw a little rectangle in the same color to fill out the pill. Note that we use
                    // TILE_SIZE for the X position and the width, but the segment size for the Y position
                    // and the height.  This is on purpose; SEGMENT_SIZE represents how big the pill capsule
                    // segments should be to allow for a boundary between adjacent pills, but we want the
                    // flat edge of the segments to butt up against the side of their bounding boxes so that
                    // when two halves are together they don't appear to have a seam.
                    renderer.fillRect (-TILE_SIZE / 2, -SEGMENT_SIZE / 2,
                                       TILE_SIZE / 2, SEGMENT_SIZE,
                                       this._properties.colorStr);
                    return;
            }
        }

        render (x : number, y : number, renderer : CanvasRenderer)
        {
            // Invoke the super, which will render a background for us at our dimensions, which we can use
            // for debugging purposes to ensure that we're drawing correctly.
            super.render (x, y, renderer);

            // Based on our type, invoke the appropriate render method.
            switch (this._properties.type)
            {
                // If we're empty, just return.
                case SegmentType.EMPTY:
                    return;

                // If we're a virus, then translate the canvas to the top left corner of the appropriate
                // location, then render the virus, restore and return.
                case SegmentType.VIRUS:
                    renderer.translateAndRotate (x, y, 0);
                    this.renderVirus (renderer);
                    renderer.restore ();
                    return;

                // Everything else is a capsule segment of some sort. All of the capsule rendering requires
                // the canvas to be translated to put the origin in the center of the cell, and some of the
                // segments also require rotation. We piggyback the single on the item that doesn't require
                // rotation, because it doesn't.
                //
                // Note that the angles are 90 degrees being down and not up because the origin of the canvas
                // is in the top left, so the sign of the Y value is opposite to what is most intuitive.
                case SegmentType.TOP:
                    renderer.translateAndRotate (x + (TILE_SIZE / 2), y + (TILE_SIZE / 2), 270);
                    break;

                case SegmentType.BOTTOM:
                    renderer.translateAndRotate (x + (TILE_SIZE / 2), y + (TILE_SIZE / 2), 90);
                    break;

                case SegmentType.LEFT:
                    renderer.translateAndRotate (x + (TILE_SIZE / 2), y + (TILE_SIZE / 2), 180);
                    break;

                case SegmentType.RIGHT:
                case SegmentType.SINGLE:
                    renderer.translateAndRotate (x + (TILE_SIZE / 2), y + (TILE_SIZE / 2), 0);
                    break;
            }

            // Now call our capsule rendering method to do the actual drawing, then restore before we return.
            this.renderCapsuleSegment (renderer);
            renderer.restore ();
        }
    }
}
