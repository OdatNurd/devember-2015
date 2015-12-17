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

        /**
         * When true, we render ourselves when asked; otherwise we silently ignore render calls.
         *
         * This is used to hide the capsule that is being held ready to drop into the bottle at the start
         * of rounds.
         */
        visible? : boolean;
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
                orientation: orientation,
                visible:     true
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
         * the capsule when it is horizontal and the middle left side when it is vertical, due to how the
         * capsule location always specifies the left or bottom segment.
         *
         * We can optionally render with some translucency, if desired. Normally this does not happen and
         * we render as fully solid. Note however that internal logic will cause the top segment of our
         * capsule to render as translucent if it is outside the confines of the bottle, regardless of the
         * parameter passed.
         *
         * Forced translucency is mainly interesting for showing a projection of where the capsule will be
         * if it drops in the bottle right now.
         *
         * @param x the x location to render ourselves at
         * @param y the y location to render ourselves at
         * @param renderer the renderer that renders us\
         * @param translucent true if we should render ourselves with some translucency, false otherwise
         */
        render (x : number, y : number, renderer : CanvasRenderer, translucent : boolean = false) : void
        {
            // If we're not visible, leave.
            if (this._properties.visible == false)
                return;

            // First segment always renders at exactly the position specified, regardless of orientation.
            this._segments[0].render (x, y, renderer, translucent);

            // The second segment renders either to the right of this position or above it, depending on
            // orientation. When we render vertically and our position is 0, the top half is rendered
            // translucent to show that it will not be applied.
            if (this._properties.orientation == CapsuleOrientation.HORIZONTAL)
                this._segments[1].render (x + TILE_SIZE, y, renderer, translucent);
            else
                this._segments[1].render (x, y - TILE_SIZE, renderer, this._mapPosition.y == 0 || translucent);
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

        /**
         * Check to see if this capsule can drop down into the bottle based on its current position or not.
         *
         * This checks the content of the bottle below our current position to see if it is empty or not,
         * taking our orientation into account, and returns an appropriate value.
         *
         * @returns {boolean} true if the capsule can drop down from its current position, or false otherwise.
         */
        canDrop () : boolean
        {
            // If we are horizontal and the bottle position underneath our right side is not empty, we
            // can't drop.
            if (this._properties.orientation == CapsuleOrientation.HORIZONTAL &&
                this._bottle.isEmptyAtXY (this._mapPosition.x + 1, this._mapPosition.y + 1) == false)
                return false;

            // We can drop if the space below us is empty.
            return this._bottle.isEmptyAtXY (this._mapPosition.x, this._mapPosition.y + 1) == true;
        }

        /**
         * Check to see if this capsule can slide to the left (true) or right (false) in the bottle based
         * on its current position or not.
         *
         * This checks the content of the bottle to the right or left of our current position to see if it
         * is empty or not, taking our orientation into account, and returns an appropriate value.
         *
         * @param left true to check if we can slide left or false to check for a right slide
         * @returns {boolean} true if the capsule can slide in this direction, or false otherwise.
         */
        canSlide (left : boolean) : boolean
        {
            // If we are vertical, then start by checking to see if our upper segment can slide in the
            // appropriate direction. This only needs to happen when our current Y position is not 0. We
            // are allowed to be vertical such that our top segment lies outside of the bottle, and in
            // this case there is nothing to stop the top part from moving but if we ask the bottle, it
            // will return NO because the position is outside the bounds of the content area.
            if (this._properties.orientation == CapsuleOrientation.VERTICAL &&
                this._mapPosition.y != 0 &&
                this._bottle.isEmptyAtXY (this._mapPosition.x + (left ? -1 : 1),
                                          this.mapPosition.y - 1) == false)
                return false;

            // We are horizontal, so if we're moving left we need to check one segment to our left, or two
            // segments to the right if we're moving right.
            return this._bottle.isEmptyAtXY (this._mapPosition.x + (left ? -1 : 2),
                                             this._mapPosition.y) == true;
        }

        /**
         * Copy the defining properties of the source segment to the destination segment provided, so that
         * the destination becomes the same type of segment.
         *
         * If the destination segment is null, nothing happens.
         *
         * @param source the segment to copy
         * @param destination the segment to copy properties to, or null to do nothing
         */
        private copySegmentInfo (source : Segment, destination : Segment) : void
        {
            if (destination)
            {
                // Copy type and color over. Since we're part of a capsule, we will never be a virus so we
                // don't need to propagate the virus polygon over.
                destination.properties.type = source.properties.type;
                destination.properties.color = source.properties.color;
            }
        }

        /**
         * Apply the contents of this capsule to the bottle, using the currently set map position as the
         * position in the bottle.
         *
         * This will overwrite the contents of the bottle; no checks are done to ensure that the contents
         * are empty first.
         *
         * Note however that this will take care to do the Right Thing (tm) if any part of the segment is
         * outside of the bottle content area.
         */
        apply () : void
        {
            // Get the segment at our direct position and then copy our first segment into it.
            let segment = this._bottle.segmentAt (this._mapPosition);
            this.copySegmentInfo (this._segments[0], segment);

            // If we are vertical and our position is 0 on the Y axis, then our top segment is outside of
            // the bottle. In this case, when we apply we should actually apply as a single segment and not
            // a bottom, because the top part of the capsule got "cut off".
            //
            // This replicates how the original Dr. Mario handles this situation/
            if (this._properties.orientation == CapsuleOrientation.VERTICAL && this._mapPosition.y == 0)
            {
                // Change the segment to be a single segment, and then leave because there's nothing else to
                // do in this situation.
                segment.properties.type = SegmentType.SINGLE;
                return;
            }

            // Get the other segment for our other capsule end. This is either to the right of us or above
            // us depending on our orientation.
            if (this._properties.orientation == CapsuleOrientation.HORIZONTAL)
                segment = this._bottle.segmentAtXY (this._mapPosition.x + 1, this._mapPosition.y);
            else
                segment = this._bottle.segmentAtXY (this._mapPosition.x, this._mapPosition.y - 1);

            // Copy it over now.
            this.copySegmentInfo (this._segments[1], segment);
        }
    }
}
