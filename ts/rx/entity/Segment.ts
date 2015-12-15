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
        LEFT,
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
         * This segment type represents a segment that used to be one of the above (non-empty) values, but
         * during a matching phase, was found to be a part of a match. Such segments are converted into
         * segments of this type, which hang around for a brief period after the match phase is over
         * before they convert into EMPTY segments, allowing things to drop down.
         *
         * This allows for a visual representation of a match that remains for a short period of time prior
         * to vanishing away. This is critical in a came like Rx where chained moves are possible, to allow
         * you to better visualize what is happening.
         */
        MATCHED,

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
         * Te segment renders in the yellow (weird) color.
         */
        YELLOW,

        /**
         * The segment renders in the red (fever) color.
         */
        RED,

        /**
         * The segment renders in the blue (chill) color.
         */
        BLUE,
    }

    /**
     * The colors to use when rendering the segments. This is meant to be indexed by an instance of
     * SegmentColor, so make sure that the order of things line up (including having the correct number of
     * items) unless you want things to not work.
     *
     * @type {Array<string>}
     */
    const RENDER_COLORS = ['#cccc00', '#cc3300', '#0033cc'];

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
     * This specifies the special structure that represents the list of polygons that make up a virus for
     * display. This doesn't actually generate any code, but it does tell the TypeScript compiler what we
     * expect the data structure to look like so that it can do compile time checks for us.
     *
     * All polygon coordinates assumes that the top left of the cell in which they will be rendered is 0, 0
     * so they are essentially offsets.
     */
    interface VirusModel
    {
        /**
         * The main body of the virus; this is rendered in the virus color.
         */
        body: Polygon;

        /**
         * The two eyes and the mouth. These are rendered in a different color than the body is, for contrast.
         */
        leftEye: Polygon;
        rightEye: Polygon;
        mouth: Polygon;
    }

    /**
     * The first variant of virus.
     *
     * @type {VirusModel}
     */
    const virusOne : VirusModel = {
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
     * @type {VirusModel}
     */
    const virusTwo : VirusModel = {
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
     * @type {VirusModel}
     */
    const virusThree : VirusModel = {
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

    /**
     * The complete list of all available virus polygon models.
     *
     * @type {Array<VirusModel>}
     */
    const virusPolygonList : Array<VirusModel> = [virusOne, virusTwo, virusThree];

    /**
     * The properties that a segment can have.
     */
    interface SegmentProperties extends EntityProperties
    {
        // @formatter:off
        /**
         * The segment type. This is used for game logic and for rendering.
         */
        type? : SegmentType;
        // @formatter:on

        /**
         * The color of this segment. This is a value that allows for comparisons and is used to set up
         * the colorStr member; this one is not used directly in rendering.
         */
        color? : SegmentColor;

        /**
         * When the segment type is a virus, this represents the polygon that should be used to render it.
         * This is selected at construction time.
         */
        poly? : VirusModel;

        /**
         * The color specification to be used for this segment when it is rendered. This is set from the
         * color member at construction time and is not updated when the color property is updated.
         */
        colorStr? : string;

        /**
         * This property is optional; if present, a true value indicates that the segment should render
         * with extra debugging information.
         */
        debug? : boolean;
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

        /****************************************************************************************************
         * DEBUG START
         *
         * Everything between this section start and the closing section below is here purely for debugging
         * support. In particular the values here contravene things by setting properties directly, which
         * is only needed while we're testing things out.
         *
         * In actual use, these would not be needed because the values would be randomly set at creation
         * time as appropriate and then left alone.
         ***************************************************************************************************/

        /**
         * This numeric value ranges over the length of the virus polygon list, and indicates which index
         * corresponds to the value of the "poly" property that specifies what polygon is being used when
         * this segment is marked as being a virus.
         *
         * DEBUG ONLY: this is only needed for debugging purposes during initial development; in practice this
         * information is not needed.
         */
        private _virusPolygon : number;

        /**
         * Get the currently selected segment type of this segment.
         *
         * @returns {SegmentType} the current segment type as taken from the properties.
         */
        get type () : SegmentType
        { return this._properties.type; }

        /**
         * Change the segment type of this segment to be the new type. No bounds checking is done.
         *
         * @param type the new type of this segment, which is set into our properties.
         */
        set type (type : SegmentType)
        { this._properties.type = type; }

        /**
         * Get the color that this segment renders as when drawn.
         *
         * @returns {SegmentColor} the current segment color of this segment.
         */
        get color () : SegmentColor
        { return this._properties.color; }

        /**
         * Change the segment color of this segment to be the new color. This updates both of the color
         * properties so that the segment will actually render in the correct color.
         */
        set color (color : SegmentColor)
        {
            this._properties.color = color;
            this._properties.colorStr = RENDER_COLORS[color];
        }

        /**
         * Get the numeric index of the polygon used to render this segment if it renders as a polygon.
         *
         * @returns {number} the polygon index.
         */
        get virusPolygon () : number
        { return this._virusPolygon; }


        /**
         * Change the polygon used to render this segment when it is rendered as a virus.
         *
         * @param poly the numeric value of the virus polygon to use. Out of range values are constrained
         * to the extremes of the possible values.
         */
        set virusPolygon (poly : number)
        {
            // Range check the value and then store it.
            if (poly < 0)
                poly = 0;
            if (poly > virusPolygonList.length - 1)
                poly = virusPolygonList.length - 1;

            // Store the new integer value, then set the value as appropriate.
            this._virusPolygon = poly;
            this._properties.poly = virusPolygonList[poly];
        }

        /**
         * Returns the number of distinct virus polygons that can be applied to the virusPolygon property
         * in order to vary their visual appearance. The values that can be applied to the virusPolygon
         * property range from 0 to this value - 1.
         *
         * @returns {number} the total number of distinct virus polygon values.
         */
        get virusPolygonCount () : number
        { return virusPolygonList.length; }

        /**************************************************************************************************
         * DEBUG END
         *************************************************************************************************/

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
            }, {}, '#666666');

            // If this is a virus, we need to set the polygon too.
            if (type == SegmentType.VIRUS)
                this.virusPolygon = Utils.randomIntInRange (0, 2);

            // Lastly, we need to set up the color string based on the color specification we were given.
            this._properties.colorStr = RENDER_COLORS[this._properties.color];
        }

        /**
         * Render ourselves as a virus using the virus polygon provided. This assumes that the rendering
         * context has already been translated to put the origin at the top left corner of the cell to render
         * the virus into.
         *
         * @param renderer the renderer to render the virus with
         */
        private renderVirus (renderer : CanvasRenderer) : void
        {
            // The eyes and mouth of the virus will be black except when the color of the virus itself
            // is blue, in which case we render it as a gray instead, to give better contrast.
            var vColor = '#000000';
            if (this._properties.color == SegmentColor.BLUE)
                vColor = '#cccccc';

            // Render out all of the polygons now.
            renderer.fillPolygon (this._properties.poly.body, this._properties.colorStr);
            renderer.fillPolygon (this._properties.poly.leftEye, vColor);
            renderer.fillPolygon (this._properties.poly.rightEye, vColor);
            renderer.fillPolygon (this._properties.poly.mouth, vColor);
        };

        /**
         * Render ourselves as a capsule segment of some sort. This assumes that the rendering context has
         * already been translated to put the origin in the center of the cell that we are supposed to
         * render into, and that it has also been rotated to make the capsule segment we render (a RIGHT)
         * appear correctly.
         *
         * @param renderer the renderer to render the capsule segment with
         */
        private renderCapsuleSegment (renderer : CanvasRenderer) : void
        {
            // How we render depends on our type.
            switch (this._properties.type)
            {
                // A single segment capsule is just a circle centered in the cell.
                case SegmentType.SINGLE:
                    renderer.fillCircle (0, 0, SEGMENT_SIZE / 2, this._properties.colorStr);
                    return;

                // A segment that is a part of a match. This is an intermediate state between when a match
                // has been detected and when the segment is made empty.
                case SegmentType.MATCHED:
                    renderer.fillCircle (0, 0, SEGMENT_SIZE / 3, this._properties.colorStr);
                    renderer.fillCircle (0, 0, SEGMENT_SIZE / 4, '#000000');
                    renderer.fillCircle (0, 0, SEGMENT_SIZE / 5, this._properties.colorStr);
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

        /**
         * This is the core rendering routine. Based on our current type and color, we draw ourselves as
         * appropriate at the provided location.
         *
         * @param x the X location to render to
         * @param y the Y location to render to
         * @param renderer the renderer to use to render ourselves
         */
        render (x : number, y : number, renderer : CanvasRenderer) : void
        {
            // If we're debugging, invoke the super, which will render a background for us at our dimensions,
            // which we can use for debugging purposes to ensure that we're drawing correctly.
            if (this._properties.debug)
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
                case SegmentType.MATCHED:
                    renderer.translateAndRotate (x + (TILE_SIZE / 2), y + (TILE_SIZE / 2), 0);
                    break;
            }

            // Now call our capsule rendering method to do the actual drawing, then restore before we return.
            this.renderCapsuleSegment (renderer);
            renderer.restore ();
        }

        /**
         * Based on the type of the segment that this is, return whether or not this segment is susceptible
         * to gravity.
         *
         * Note that this tells you if something CAN fall, not if it SHOULD fall, because a segment has no
         * idea of what it might be adjacent to.
         *
         * @returns {boolean} true if this segment can be affected by gravity or false if it can not
         */
        canFall () : boolean
        {
            // Check based on type.
            switch (this._properties.type)
            {
                // Single segments, LEFT segments and BOTTOM segments can fall.
                case SegmentType.SINGLE:
                case SegmentType.LEFT:
                case SegmentType.BOTTOM:
                    return true;

                // Everything else cannot; viruses are always held in place, and the RIGHT/TOP segments
                // get pulled along when the capsule segment they're attached to move. So even though they
                // technically CAN fall, we report that they can't.
                default:
                    return false;
            }
        }

        /**
         * Compares some other segment to us to see if they constitute a match or not. This returns true
         * when the current segment an the passed in segment are both non-empty segments of the same color.
         *
         * @param other the other segment to check (can be null)
         */
        matches (other : Segment) : boolean
        {
            // If we didn't get another segment, or we did but we're not the same color, then we don't match.
            if (other == null || this._properties.color != other._properties.color)
                return false;

            // We are the same color and both exist. If either one of us is EMPTY, we can't be a match
            // because empty doesn't match anything (it's empty).
            if (this._properties.type == SegmentType.EMPTY || other._properties.type == SegmentType.EMPTY)
                return false;

            // We are both a non empty segment of the same color, we match.
            return true;
        }
    }
}
