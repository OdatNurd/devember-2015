module nurdz.game
{
    /**
     * This represents the different types of capsules that are possible.
     *
     * This represents all possible color combinations in all possible orientations (i.e. Red-Blue is
     * unique from Blue-Red). There are 9 such unique combinations.
     *
     * These combinations are laid out so that the colors on each side go in the standard color order of
     * YELLOW, RED and BLUE, so that we can do tricky things to extract the colors.
     */
    export enum CapsuleType
    {
        YELLOW_YELLOW,
        YELLOW_RED,
        YELLOW_BLUE,

        RED_YELLOW,
        RED_RED,
        RED_BLUE,

        BLUE_YELLOW,
        BLUE_RED,
        BLUE_BLUE,
    }

    /**
     * This represents the different orientations allowed for the capsule.
     */
    export enum CapsuleOrientation
    {
        /**
         * The capsule is laid out horizontally. In this orientation, our position represents the left
         * side of the capsule.
         */
        HORIZONTAL,

        /**
         * The capsule is laid out vertically. In this orientation, our position represents the bottom end
         * of the capsule.
         */
        VERTICAL,
    }

    /**
     * The properties that a capsule can have.
     */
    interface CapsuleProperties extends EntityProperties
    {
        // @formatter:off
        /**
         * The capsule type. This is used to determine the colors of the segments, and will get updated
         * when our orientation flips 180 degrees (e.g. RED_BLUE becomes BLUE_RED when flipped twice).
         */
        type? : CapsuleType;
        // @formatter:on

        /**
         * The orientation of the capsule, which controls how we render ourselves on the screen, as well
         * as controlling how the capsule interacts with the rest of the bottle contents.
         */
        orientation? : CapsuleOrientation;
    }

    /**
     * This entity represents the user controllable capsule that is used to play the game and to show what
     * capsule(s) are coming next.
     *
     * This is a collection of two segments of a particular color that always arrange themselves so as to
     * be a pair of LEFT/RIGHT or TOP/BOTTOM segments.
     *
     * A capsule can be either horizontal or vertical; a horizontal capsule position is relative to it's
     * left hand side while a vertical capsule has a position relative to its bottom segment.
     *
     * In practice this means that while a horizontal capsule has a position referenced from the usual
     * origin location for entities, a vertical one actually has a position relative to the midpoint of
     * its left side.
     */
    export class Capsule extends Entity
    {
        /**
         * Redeclare our capsule properties so that it is of the correct type. This is allowed because the
         * member is protected.
         */
        protected _properties : CapsuleProperties;
        get properties () : CapsuleProperties
        { return this._properties; }

        /**
         * The two segments that make up our capsule. This is always an array of two segments.
         *
         * We maintain the array such that for a horizontal capsule, the first element is the left segment
         * and the second is the right, and for a vertical capsule the first element is the bottom segment
         * and the second one is the top.
         */
        private _segments : Array<Segment>;

        /**
         * The bottle that owns us; this is responsible for converting our bottle content position into a
         * stage position, since it knows where it is on the stage and also where inside its coordinate
         * space the bottle contents are.
         */
        private _bottle : Bottle;

        /**
         * Construct a new capsule.
         *
         * @param stage the stage that will be used to render this segment
         * @param bottle the bottle that contains us
         * @param type the type of capsule to create; this specifies our color
         * @param orientation the orientation of the capsule
         */
        constructor (stage : Stage, bottle : Bottle, type : CapsuleType,
                     orientation : CapsuleOrientation = CapsuleOrientation.HORIZONTAL)
        {
            // Call the super class. The only important part here is the stage. We don't care about our
            // position because something else tells us where to render, and our size is always
            // constrained by the size of tiles.
            //
            // Here we set the type and orientation parameters directly into our properties.
            super ("Capsule", stage, 1, 1, TILE_SIZE * 2, TILE_SIZE, 1, <CapsuleProperties> {
                type:        type,
                orientation: orientation
            }, {}, '#333333');

            // Save the bottle that we were provided.
            this._bottle = bottle;

            // Create our two segments and then call our update function to give them an appropriate color
            // and layout based on the parameters we were given.
            this._segments = [
                new Segment (stage, SegmentType.LEFT, SegmentColor.BLUE),
                new Segment (stage, SegmentType.RIGHT, SegmentColor.RED)
            ];
            this.updateSegments ();
        }

        /**
         * Render our capsule at the provided stage position.
         *
         * The position provided is always the capsule "root" position, which is the top left corner of
         * the capsule when it is horizontal and the middle left side when it is verical, due to how the
         * capsule location always specifies the left or bottom segment.
         *
         * @param x the x location to render ourselves at
         * @param y the y location to render ourselves at
         * @param renderer the renderer that renders us
         */
        render (x : number, y : number, renderer : CanvasRenderer) : void
        {
            // First segment always renders at exactly the position specified, regardless of orientation.
            this._segments[0].render (x, y, renderer);

            // The second segment renders either to the right of this position or above it, depending on
            // orientation.
            if (this._properties.orientation == CapsuleOrientation.HORIZONTAL)
                this._segments[1].render (x + TILE_SIZE, y, renderer);
            else
                this._segments[1].render (x, y - TILE_SIZE, renderer);
        }

        /**
         * Set the stage position of this capsule; unlike the general Actor method of the same name, this
         * DOES NOT modify the map location of the capsule in any way.
         *
         * @param x the new X position on the stage
         * @param y the new Y position on the stage
         */
        setStagePositionXY (x : number, y : number) : void
        {
            // Set the stage position but otherwise do nothing; the super version of this also sets our
            // map position, which we don't want it to do.
            this._position.setToXY (x, y);
        }

        /**
         * Set the map (bottle content) position of this capsule, and then have that change be propagated
         * automatically to the stage position. This uses the bottle we were given at construction time to
         * do the conversion for us.
         *
         * This accepts negative values for both of these values, which will cause the capsule to appear
         * outside of the content area of the bottle (although still aligned to it).
         *
         * @param x the new X position in the bottle content area to set
         * @param y the new Y position in the bottle content area to set
         */
        setMapPositionXY (x : number, y : number) : void
        {
            // First, save the position as we were given it.
            this._mapPosition.setToXY (x, y);

            // Now copy this to the stage position and get the bottle to modify it to be in the correct
            // stage location/
            this._position.setToXY (x, y);
            this._bottle.translateContentPosToStage (this._position);
        }

        /**
         * This method updates the internal segments that make up the capsule based on the current
         * settings of the properties.
         *
         * This should be invoked whenever the orientation and/or type of the capsule changes, so that it
         * renders appropriately.
         */
        updateSegments () : void
        {
            // First, set the segment types as appropriate. When we're horizontal they go left/right,
            // otherwise they go bottom/top (the first segment is always either the left or bottom,
            // respectively).
            if (this._properties.orientation == CapsuleOrientation.HORIZONTAL)
            {
                this._segments[0].properties.type = SegmentType.LEFT;
                this._segments[1].properties.type = SegmentType.RIGHT;
            }
            else
            {
                this._segments[0].properties.type = SegmentType.BOTTOM;
                this._segments[1].properties.type = SegmentType.TOP;
            }

            // Now, set the colors of the two segments as appropriate. We have carefully laid out the
            // capsule type enum so that the colors always go in the same order as the colors in the
            // segment class (which are laid out that way to make virus insertion easier).
            //
            // Due to this layout, a modulo operation tells us the color on the right hand side and an
            // integer division gives us the color on the left side.
            this._segments[0].properties.color = Math.floor (this._properties.type / 3);
            this._segments[1].properties.color = this._properties.type % 3;
        }
    }
}
