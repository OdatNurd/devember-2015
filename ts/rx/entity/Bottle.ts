module nurdz.game
{
    /**
     * The width of the pill bottle contents area, in pills (tiles/segments).
     *
     * @type {number}
     */
    const BOTTLE_WIDTH = 8;

    /**
     * The height of the pill bottle contents area, in pills (tiles/segments).
     *
     * @type {number}
     */
    const BOTTLE_HEIGHT = 16;

    /**
     * The number of frame updates that happen between checks to see if the contents of the bottle should
     * continue to drop down or not. This essentially controls the speed of how fast things fall.
     *
     * @type {number}
     */
    const CONTENT_DROP_TICKS = 5;

    /**
     * The number of frame updates that the results of a match will remain displayed before we remove
     * them. While match results are displayed, nothing else can drop.
     *
     * @type {number}
     */
    const MATCH_DISPLAY_TICKS = 10;

    /**
     * The number of consecutive segments that need to match in a row or column in order to be considered
     * a match.
     *
     * @type {number}
     */
    const MATCH_LENGTH = 4;

    /**
     * The width of the margin around the pill bottle contents area, in pills (tiles/segments). This
     * number of pill segments is added to the overall width and height of the contents area as the area
     * in which to render the actual bottle.
     *
     * As such, half of this margin appears on the left/top and the other half appears on the right/bottom.
     *
     * @type {number}
     */
    const BOTTLE_MARGIN = 2;

    /**
     * The properties that a bottle can have.
     */
    interface BottleProperties extends EntityProperties
    {
        /**
         * The color string to use to render the bottle outline.
         */
        colorStr? : string;
    }

    /**
     * This entity represents the pill bottle, which is responsible for managing the display, detecting
     * matches, and all other core game logic that relates directly the the contents of the game field.
     */
    export class Bottle extends Entity
    {
        /**
         * Redeclare our bottle properties so that it is of the correct type. This is allowed because the
         * member is protected.
         */
        protected _properties : BottleProperties;
        get properties () : BottleProperties
        { return this._properties; }

        /**
         * This holds the contents of the bottle, which is the actual game board. This is an array of
         * BOTTLE_WIDTH * BOTTLE_HEIGHT elements of the Segment entity.
         */
        private _contents : Array<Segment>;

        /**
         * The offset from our origin position that the content area of the bottle renders at.
         */
        private _contentOffset : Point;

        /**
         * The description of the polygon that describes the shape of the bottle based on the properties
         * at the time of construction.
         */
        private _bottlePolygon : Polygon;

        /**
         * The number of ticks that have happened so far (one tick = one frame update).
         *
         * We use this value to time things.
         */
        private _ticks : number;

        /**
         * The value of this is true if and only if the last frame update was a frame where gravity was
         * checked to see if anything should be dropping, AND at least one segment was moved as a result.
         * Otherwise, this is false.
         *
         * This is used to determine when it's time to check for matches, which only has to happen
         * whenever there was something moving and it has now stopped.
         */
        private _dropping : boolean;

        /**
         * The number of ticks that were on the clock the last time that we allowed a drop to happen. We
         * use this to space out drops to ensure that they happen at a set interval.
         */
        private _dropTicks : number;

        /**
         * The value of this is true if and only if a match was just found, which means that there are
         * some segments of type MATCHING currently in the bottle.
         *
         * While that is the case, nothing is affected by gravity and the contents are essentially
         * "frozen" until the match is complete (all MATCHING segments turn to EMPTY) and this boolean
         * gets set to false.
         */
        private _matching : boolean;

        /**
         * When _matching gets set to true because at least one match was found, this value is set to the
         * current tick count. This is used to determine when the matched segments have been left visible
         * long enough so that we can remove them.
         */
        private _matchTicks : number;

        /**
         * Construct a new bottle. The bottle is a defined size to render the bottle image itself as well
         * as its contents, and it centers itself on the stage at an appropriate position.
         *
         * The bottle is responsible for all of the game logic that has to do with the board itself.
         *
         * @param stage the stage that will manage this entity/
         * @param color the color to render the bottle with
         */
        constructor (stage : Stage, color : string)
        {
            // Calculate the dimensions of the bottle in pixels. This is inclusive of both the margins and
            // the inner contents area.
            let width = (BOTTLE_WIDTH + BOTTLE_MARGIN) * TILE_SIZE;
            let height = (BOTTLE_HEIGHT + BOTTLE_MARGIN) * TILE_SIZE;

            // Configure ourselves to be large and in charge. We center ourselves horizontally on the
            // stage and place our bottom against the bottom of the stage.
            super ("Bottle", stage, (stage.width / 2) - (width / 2), stage.height - height,
                   width, height, 1, <BottleProperties> {colorStr: color});

            // Start our tick count initialized.
            this._ticks = 0;
            this._dropTicks = 0;

            // By default, we're not matching and nothing has been dropping.
            this._dropping = false;
            this._matching = false;

            // Construct the bottle polygon for later.
            this._bottlePolygon = this.getBottlePolygon ();

            // Set up the position of the bottle contents to be half the horizontal and vertical margins
            // away from the top left corner.
            this._contentOffset = new Point ((BOTTLE_MARGIN / 2) * TILE_SIZE, (BOTTLE_MARGIN / 2) * TILE_SIZE);

            // Fill the bottle contents with empty segments.
            this._contents = [];
            for (let i = 0 ; i < BOTTLE_WIDTH * BOTTLE_HEIGHT ; i++)
                this._contents[i] = new game.Segment (stage, SegmentType.EMPTY, SegmentColor.BLUE);
        }

        /**
         * Given the current values for the bottle size, calculate and return a polygon that will render
         * the outline of the bottle.
         *
         * @returns {Polygon} the bottle polygon
         */
        private getBottlePolygon () : Polygon
        {
            let retVal = [];

            // Alias half of a tile, since we're going to be using that a lot.
            const halfTile = (TILE_SIZE / 2);

            // The opening in the bottle is always exactly 2 segments wide (large enough for a single pill
            // to enter it), aligned to the segment boundary, and as close to being centered as possible.
            //
            // Calculate how many segments there are to the left and right of the bottle opening. The
            // right hand side is easier to calculate because it's a simple subtraction to determine
            // what's left.
            //
            // Note that we use Math.floor here so that if the bottle is an odd number of segments wide,
            // things still work as expected.
            var leftEdgeSegments = Math.floor ((BOTTLE_WIDTH + BOTTLE_MARGIN - 2) / 2);
            var rightEdgeSegments = BOTTLE_WIDTH + BOTTLE_MARGIN - 2 - leftEdgeSegments;

            // Create an origin point.
            let point = new Point (0, 0);

            // Translate the p0int above by the values passed in, then store the new point into the return
            // value array as an array of two numbers.
            function storeOffset (xOffs : number, yOffs : number)
            {
                point.translateXY (xOffs, yOffs);
                retVal.push (point.toArray ());
            }

            // The top left corner of the exterior of the bottle starts at the center of the segment that
            // the origin is in and goes down for the entire height less one segment (because the bottle
            // walls are half a segment in thickness.
            storeOffset (halfTile, halfTile);
            storeOffset (0, (BOTTLE_HEIGHT + BOTTLE_MARGIN - 1) * TILE_SIZE);

            // Now we go across for the width less one segment and back up.
            storeOffset ((BOTTLE_WIDTH + BOTTLE_MARGIN - 1) * TILE_SIZE, 0);
            storeOffset (0, -(BOTTLE_HEIGHT + BOTTLE_MARGIN - 1) * TILE_SIZE);

            // Draw the top right side of the bottle. This requires us to move left, up, left, down and
            // right, which will end us 1/2 a tile (the thickness of the bottle walls) left and down from
            // where we started.
            storeOffset (-(rightEdgeSegments - 1) * TILE_SIZE, 0);
            storeOffset (0, -halfTile);
            storeOffset (-halfTile, 0);
            storeOffset (0, TILE_SIZE);
            storeOffset ((rightEdgeSegments - 1) * TILE_SIZE, 0);

            // Now describe the interior of the bottle walls by going down, left and back up.
            storeOffset (0, BOTTLE_HEIGHT * TILE_SIZE);
            storeOffset (-BOTTLE_WIDTH * TILE_SIZE, 0);
            storeOffset (0, -BOTTLE_HEIGHT * TILE_SIZE);

            // Now describe the top left part of the bottle in the same manner as we did to the top right,
            // only we're starting on the inside and going out instead of the other way around.
            storeOffset ((leftEdgeSegments - 1) * TILE_SIZE, 0);
            storeOffset (0, -TILE_SIZE);
            storeOffset (-halfTile, 0);
            storeOffset (0, halfTile);

            return retVal;
        }

        /**
         * This method is responsible for rendering the bottle image. This assumes that there is a total
         * margin (in tiles) or BOTTLE_MARGIN around the content area of the bottle, and that the rendering
         * of the bottle should thus take no more than (BOTTLE_MARGIN * TILE_WIDTH) / 2 pixels on each side.
         *
         * @param x the x location to render the bottle image at
         * @param y the y location to render the bottle image at
         * @param renderer the renderer to use to render the bottle.
         */
        private renderBottle (x : number, y : number, renderer : CanvasRenderer) : void
        {
            // Let the super render our background for us so we can determine if the bounds of the bottle
            // object are correct or not.
            //super.render (x, y, renderer);

            // Translate the canvass to our rendering position and set up to fill with our bottle color.
            renderer.translateAndRotate (x, y);
            renderer.fillPolygon (this._bottlePolygon, this._properties.colorStr);
            renderer.restore ();
        }

        /**
         * Render ourselves to the screen, along with our contents
         * @param x the X location to render at
         * @param y the Y location to render at
         * @param renderer the renderer to use to render ourselves
         */
        render (x : number, y : number, renderer : CanvasRenderer) : void
        {
            // Start by rendering the bottle.
            this.renderBottle (x, y, renderer);

            // Now iterate over our contents and render it out. Here we do a transform to put the origin
            // at the point on the canvas where the top left of the bottle interior is, so that we don't
            // have to do an extra translation for everything.
            renderer.translateAndRotate (x + this._contentOffset.x, y + this._contentOffset.y);
            for (let y = 0, i = 0 ; y < BOTTLE_HEIGHT ; y++)
            {
                for (let x = 0 ; x < BOTTLE_WIDTH ; x++, i++)
                {
                    // Get the segment and render it.
                    var segment = this._contents[i];
                    segment.render (x * TILE_SIZE,
                                    y * TILE_SIZE,
                                    renderer);
                }
            }

            renderer.restore ();
        }

        /**
         * This gets invoked every frame prior to our render method being called.
         *
         * Here we see if it's time for the game state to advance, and if so, we do it.
         *
         * @param stage the stage that owns us.
         */
        update (stage : Stage) : void
        {
            // Count this frame update as a tick.
            this._ticks++;

            // If we're currently displaying matches in the bottle and we've been waiting long enough, go
            // ahead and clear them out and then remove the flag so more drops can happen.
            if (this._matching && this._ticks >= this._matchTicks + MATCH_DISPLAY_TICKS)
            {
                // Scan over the entire bottle contents and replace all matched segments with empty ones.
                for (let y = 0 ; y < BOTTLE_HEIGHT ; y++)
                {
                    for (let x = 0 ; x < BOTTLE_WIDTH ; x++)
                    {
                        let segment = this.segmentAt (x, y);
                        if (segment.properties.type == SegmentType.MATCHED)
                            segment.properties.type = SegmentType.EMPTY;
                    }
                }

                // No longer matching, so start a drop operation to see if anything else needs to happen.
                this._matching = false;
                this._dropping = true;
                this._dropTicks = -1;
            }

            // If we have been told that we should be dropping things AND enough time has passed since the
            // last time we did a drop, then try to do a drop now.
            if (this._dropping == true && this._ticks >= this._dropTicks + CONTENT_DROP_TICKS)
            {
                // Do a gravity check to see if there is anything to move.
                let didDrop = this.contentGravityStep ();

                // If we didn't drop anything, then it's time to check to see if there is a match because all
                // falling segments have fallen as far as they can. The check function will turn off
                // dropping and turn on match display if any are found.
                if (didDrop == false)
                    this.checkForMatches ();

                // Now save the state of this operation for the next time, and save the tick count that we
                // did this at, so that we know when to start again. This will either stop our drop or let
                // us take another step.
                this._dropping = didDrop;
                this._dropTicks = this._ticks;
            }

        }

        /**
         * The bottle responds to all triggers by checking for matches, which may also cause a drop.
         *
         * This is meant to be invoked every time the capsule that the player is moving around in the bottle
         * comes to rest, to see if any matches need to happen.
         *
         * @param activator always null
         */
        trigger (activator : Actor = null) : void
        {
            // TODO Really this should always just trigger a match; the drop is just for debugging purposes

            // Set the flag that indicates that a drop should happen now
            if (activator == null)
            {
                this._dropping = true;
                this._dropTicks = -1;
            }
            else
                this.checkForMatches ();
        }

        /**
         * Given A location in the bottle contents, return the segment object at that location, or null if
         * the location is not valid.
         *
         * @param x the X location in the bottle to get the segment for
         * @param y the Y location in the bottle to get the segment for
         * @returns {Segment} the segment at the given location, or null if that location is invalid
         */
        private segmentAt (x : number, y : number) : Segment
        {
            // If the location provided is not inside the contents of the bottle, then it is not empty space.
            if (x < 0 || y < 0 || x >= BOTTLE_WIDTH || y >= BOTTLE_HEIGHT)
                return null;

            // Return empty status
            return this._contents[y * BOTTLE_WIDTH + x];
        }

        /**
         * Given a location in the bottle contents, check to see if that position is empty or not.
         *
         * When the location provided is out of range for the bottle contents, false is always returned.
         *
         * @param x the X location in the bottle to check
         * @param y the Y location in the bottle to check
         * @returns {boolean} true if the segment at that position in the bottle is empty, or false if it
         * is not or the position is not inside the bottle
         */
        private isEmpty (x : number, y : number) : boolean
        {
            // Get the segment at the provided location. If we got one, return if it's empty. If the
            // location is invalid, the method returns null, in which case we assume that the space is not
            // empty.
            let segment = this.segmentAt (x, y);
            if (segment != null)
                return segment.properties.type == SegmentType.EMPTY;

            return false;
        }

        /**
         * Cause the segment at the provided location to drop down in the bottle contents.
         *
         * Since we assume that the only way for a segment to drop is if the space under it is empty, this
         * operates by swapping the position of the item specified and the item that is below it in the grid.
         *
         * This is faster than modifying a bunch of properties, but it does mean that this should not be
         * called for items that don't have a blank space under them or which don't have ANY space under
         * them (i.e. at the bottom of the bottle).
         *
         * @param x the X location of the segment to drop
         * @param y the Y location of the segment to drop
         */
        private dropSegment (x : number, y : number) : void
        {
            // Calculate the offset of the segment provided and the segment below it.
            let topOffs = y * BOTTLE_WIDTH + x;
            let bottomOffs = (y + 1) * BOTTLE_WIDTH + x;

            // Swap the two values around.
            let temp = this._contents[bottomOffs];
            this._contents[bottomOffs] = this._contents[topOffs];
            this._contents[topOffs] = temp;
        }

        /**
         * Perform one gravity step for the contents of the bottle.
         *
         * This scans the entire bottle for segments that are hanging in mid-air when they should not be,
         * and drops them down if possible.
         *
         * This takes care to make sure that capsules are dropped as connected units (e.g. a LEFT and
         * RIGHT will drop together, but only if there is space for both of them to drop).
         *
         * What this does NOT take into account is bottle contents that violate the constraints of the
         * game. For example, a LEFT always drags what is to it's immediate right down with it, even if
         * that segment is for example a Virus, which is always stationary, because there is no valid
         * state in the game for a LEFT to be on the board without a RIGHT being next to it.
         *
         * @returns {boolean} true if any capsules were dropped, or false if none were
         */
        private contentGravityStep () : boolean
        {
            let didDrop = false;

            // Scan the entire contents of the bottle from left to right and top to bottom. We start from
            // the second row from the bottom, since the segments on the bottom can't move down anyway.
            for (let y = BOTTLE_HEIGHT - 2 ; y >= 0 ; y--)
            {
                for (let x = 0 ; x < BOTTLE_WIDTH ; x++)
                {
                    // Get the segment at the position we are currently considering.
                    let segment = this.segmentAt (x, y);

                    // Check and see if we are subject to gravity here. If we are not, we can skip to the
                    // next element.
                    //
                    // In particular, we are not susceptible to gravity when:
                    //   o This segment is not affected by gravity (e.g. a virus)
                    //   o The segment under us is not empty, so there is no place to fall
                    //   o We are a LEFT side capsule, but there is no empty space for our attached RIGHT
                    //     side to drop.
                    if (segment.canFall () == false || this.isEmpty (x, y + 1) == false ||
                        segment.properties.type == SegmentType.LEFT && this.isEmpty (x + 1, y + 1) == false)
                        continue;

                    // Drop ourselves down, and then based on our type, possibly also drop down something
                    // else.
                    this.dropSegment (x, y);
                    switch (segment.properties.type)
                    {
                        // When this segment is a left segment, we also need to drop the segment to our
                        // right, which should be a RIGHT.
                        case SegmentType.LEFT:
                            this.dropSegment (x + 1, y);
                            break;

                        // When this segment is a BOTTOM, we also need to drop the segment above us, which
                        // should be a TOP.
                        case SegmentType.BOTTOM:
                            this.dropSegment (x, y - 1);
                            break;
                    }

                    // Set the flag that indicates that we dropped at least one segment
                    didDrop = true;
                }
            }

            return didDrop;
        }

        /**
         * Mark the segment at the provided location as a matched segment by converting its segment type
         * to a MATCHED segment. This also takes care of transforming adjacent connected segments into the
         * appropriate type (e.g. if this is a LEFT, the RIGHT is turned into a SINGLE).
         *
         * @param x the X position to transform
         * @param y the Y position to transform
         */
        private markSegment (x : number, y : number) : void
        {
            // Get the segment and then store its current type.
            let segment = this.segmentAt (x, y);
            let type = segment.properties.type;

            // If this segment is already a MATCHED segment, then leave without doing anything else, as
            // this was already taken care of as a part of the match somewhere else.
            if (type == SegmentType.MATCHED)
                return;

            // Convert the segment to matched segment and then get the connected segment. This will return
            // null if the connected segment is out of bounds or if this segment can't have a connection
            // anyway.
            segment.properties.type = SegmentType.MATCHED;
            switch (type)
            {
                case SegmentType.LEFT:
                    segment = this.segmentAt (x + 1, y);
                    break;

                case SegmentType.RIGHT:
                    segment = this.segmentAt (x - 1, y);
                    break;

                case SegmentType.TOP:
                    segment = this.segmentAt (x, y + 1);
                    break;

                case SegmentType.BOTTOM:
                    segment = this.segmentAt (x, y - 1);
                    break;

                // Nothing to fix up for any other segment
                default:
                    segment = null;
            }

            // If we found a connected segment, mark it as a SINGLE as it is no longer a part of a
            // complete capsule.
            if (segment != null)
                segment.properties.type = SegmentType.SINGLE;
        }

        /**
         * Mark the segments for a horizontal match starting at x, y and running for the provided length.
         * This transforms all of the segments in the match into matched segments, taking care to break
         * any capsules that might have taken part in the match.
         *
         * When horizontal is true, the X,Y represent the left side of a horizontal match to be marked.
         *
         * When horizontal is false, the X,y represents the top side of a vertical match to be marked.
         *
         * @param x the X location of the start of the match
         * @param y the Y location of the start of the match
         * @param matchLength the length of the match in capsules
         * @param horizontal true if the match is horizontal, false if the match is vertical.
         */
        private markMatch (x : number, y : number, matchLength : number, horizontal : boolean) : void
        {
            // The number of segments we have marked so far
            let marked = 0;

            // Keep looping until we have fixed as many things as we were told to mark.
            while (marked != matchLength)
            {
                // If the X or Y is out of bounds, then just leave. This protects us against doing
                // something quite stupid somewhere.
                if (x < 0 || y < 0 || x >= BOTTLE_WIDTH || y >= BOTTLE_HEIGHT)
                {
                    console.log ("markMatchSegments() passed invalid match to mark");
                    return;
                }

                // Mark the item at the current position.
                this.markSegment (x, y);
                marked++;

                // If this is a horizontal segment, increment X; otherwise increment Y
                if (horizontal)
                    x++;
                else
                    y++;
            }
        }

        /**
         * Scan the row of the bottle provided to see if there are any matches. For any matches of an
         * appropriate length, the matching segments are turned into a MATCHED segment.
         *
         * @param y the row in the bottle contents to check for matches
         * @returns {boolean} true if at least one match was found, false otherwise
         */
        private checkRowMatch (y : number) : boolean
        {
            // This gets set to true every time we find a match in this row.
            let foundMatch = false;

            // Scan from left to right. We keep searching until we exceed the position on the right where
            // we know no more matches can be found because there are not enough positions left.
            let x = 0;
            while (x < BOTTLE_WIDTH - MATCH_LENGTH + 1)
            {
                // Get the segment at this location.
                let segment = this.segmentAt (x, y);

                // If we're empty, then skip ahead to the next element; empty segments can't be a part of
                // a match.
                if (segment.properties.type == SegmentType.EMPTY)
                {
                    x++;
                    continue;
                }

                // See how many elements to the right we can go until we find an element that does not
                // match this one.
                let searchX = x + 1;
                while (segment.matches (this.segmentAt (searchX, y)))
                    searchX++;

                // Calculate how long the match is. If it's long enough, then we need to mark the match
                // for all of those segments and then set the flag that says that we found a match.
                let matchLength = searchX - x;
                if (matchLength >= MATCH_LENGTH)
                {
                    this.markMatch (x, y, matchLength, true);
                    foundMatch = true;
                }

                // Restart the search now. Since we stopped at the first thing that was not a match with
                // where we started, we start the next search from there.
                x = searchX;
            }

            return foundMatch;
        }

        /**
         * Scan the column of the bottle provided to see if there are any matches. For any matches of an
         * appropriate length, the matching segments are turned into a MATCHED segment.
         *
         * @param x the column in the bottle contents to check for matches
         * @returns {boolean} true if at least one match was found, false otherwise
         */
        private checkColumnMatch (x : number) : boolean
        {
            // This gets set to true every time we find a match in this row.
            let foundMatch = false;

            // Scan from left to right. We keep searching until we exceed the position on the right where
            // we know no more matches can be found because there are not enough positions left.
            let y = 0;
            while (y < BOTTLE_HEIGHT - MATCH_LENGTH + 1)
            {
                // Get the segment at this location.
                let segment = this.segmentAt (x, y);

                // If we're empty, then skip ahead to the next element; empty segments can't be a part of
                // a match.
                if (segment.properties.type == SegmentType.EMPTY)
                {
                    y++;
                    continue;
                }

                // See how many elements downwards we can go until we find an element that does not match
                // this one.
                let searchY = y + 1;
                while (segment.matches (this.segmentAt (x, searchY)))
                    searchY++;

                // Calculate how long the match is. If it's long enough, then we need to mark the match
                // for all of those segments and then set the flag that says that we found a match.
                let matchLength = searchY - y;
                if (matchLength >= MATCH_LENGTH)
                {
                    this.markMatch (x, y, matchLength, false);
                    foundMatch = true;
                }

                // Restart the search now. Since we stopped at the first thing that was not a match with
                // where we started, we start the next search from there.
                y = searchY;
            }

            return foundMatch;
        }


        /**
         * Perform a scan to see if there are any matches currently existing in the bottle contents. A
         * match is a horizontal or vertical row of at least 4 non-empty segments of the same color.
         *
         * A horizontal and vertical match are both allowed to intersect, forming one giant match.
         *
         * Any such matches found have their segments transformed from their current type into a segment
         * of type MATCHING, which remains on the board for a few ticks prior to their being made EMPTY.
         *
         * When a match happens, we set a global flag that indicates that we're displaying a match, which
         * will keep the results displayed for a short period before they vanish away. We also make sure
         * that no segments drop while the matches are being displayed.
         */
        private checkForMatches () : void
        {
            // This flag gets set to true if we find any matches this run and becomes our eventual return
            // value.
            let foundMatch = false;

            // Check for matches first on the horizontal and then on the vertical.
            //
            // Every match found sets the flag to true so that we can return the affirmative if we found
            // any matches. The matching functions also take care of marking the matched segments and
            // splitting apart any partially matched capsules.
            for (let y = 0 ; y < BOTTLE_HEIGHT ; y++)
            {
                if (this.checkRowMatch (y))
                    foundMatch = true;
            }

            // Now do the same thing with columns.
            for (let x = 0 ; x < BOTTLE_WIDTH ; x++)
            {
                if (this.checkColumnMatch (x))
                    foundMatch = true;
            }

            // If we found at least one match, we need to stop any dropping from happening, set up the
            // flag that indicates that we are displaying matches, and then set the current time so that
            // the matches display for the proper amount of time before the update() method clears them
            // away for us.
            if (foundMatch)
            {
                this._dropping = false;
                this._matching = true;
                this._matchTicks = this._ticks;
            }
        }

        /**
         * Given a position on the stage, this will determine if that position is inside the contents area
         * of this bottle or not. If it is, the segment that is under that position will be returned.
         * Otherwise, null is returned.
         *
         * @param stagePos the position to check
         * @returns {Segment} the segment at the provided position on the stage, or null if the position
         * is not inside the contents area of the bottle.
         */
        segmentAtStagePosition (stagePos : Point) : Segment
        {
            // If it's inside the bottle, we can do something with it.
            if (stagePos.x >= this._position.x + this._contentOffset.x &&
                stagePos.y >= this._position.y + this._contentOffset.y &&
                stagePos.x < this._position.x + this._width - this._contentOffset.x &&
                stagePos.y < this._position.y + this._height - this._contentOffset.y)
            {
                // Convert the position to a tile by first transforming the point to be relative to the
                // origin of the screen and then constraining it to a tile dimension. We do this in a copy
                // so as to not modify the point provided to us.
                stagePos = stagePos.copyTranslatedXY (-this._position.x - this._contentOffset.x,
                                                      -this._position.y - this._contentOffset.y)
                    .reduce (TILE_SIZE);

                // Get the segment clicked on and twiddle its type.
                return this._contents[stagePos.y * BOTTLE_WIDTH + stagePos.x];
            }

            // It's out of bounds.
            return null;
        }
    }
}
