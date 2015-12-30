var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var nurdz;
(function (nurdz) {
    var game;
    (function (game) {
        /**
         * The width of the pill bottle contents area, in pills (tiles/segments).
         *
         * @type {number}
         */
        var BOTTLE_WIDTH = 8;
        /**
         * The height of the pill bottle contents area, in pills (tiles/segments).
         *
         * @type {number}
         */
        var BOTTLE_HEIGHT = 16;
        /**
         * The number of frame updates that happen between checks to see if the contents of the bottle should
         * continue to drop down or not. This essentially controls the speed of how fast things fall.
         *
         * @type {number}
         */
        var CONTENT_DROP_TICKS = 5;
        /**
         * The number of frame updates that the results of a match will remain displayed before we remove
         * them. While match results are displayed, nothing else can drop.
         *
         * @type {number}
         */
        var MATCH_DISPLAY_TICKS = 10;
        /**
         * The number of consecutive segments that need to match in a row or column in order to be considered
         * a match.
         *
         * @type {number}
         */
        var MATCH_LENGTH = 4;
        /**
         * The width of the margin around the pill bottle contents area, in pills (tiles/segments). This
         * number of pill segments is added to the overall width and height of the contents area as the area
         * in which to render the actual bottle.
         *
         * As such, half of this margin appears on the left/top and the other half appears on the right/bottom.
         *
         * @type {number}
         */
        var BOTTLE_MARGIN = 2;
        /**
         * The segment offset at which the opening of the bottle appears, visually.
         *
         * The opening in the bottle is always exactly 2 segments wide, which is large enough for a single
         * horizontal capsule to fit), is always aligned to a segment boundary, and is as close to centered as
         * is possible while remaining aligned.
         *
         * This value indicates how many segments to the right of the bottle x,y position the opening is. Note
         * however that the position takes the margins of the bottle into account, and so in order to
         * determine the actual content location that aligns with this, you need to subtract half of
         * BOTTLE_MARGIN.
         *
         * @type {number}
         */
        var BOTTLE_OPENING_SEGMENT = Math.floor((BOTTLE_WIDTH + BOTTLE_MARGIN - 2) / 2);
        /**
         * This entity represents the pill bottle, which is responsible for managing the display, detecting
         * matches, and all other core game logic that relates directly the the contents of the game field.
         */
        var Bottle = (function (_super) {
            __extends(Bottle, _super);
            /**
             * Construct a new bottle. The bottle is a defined size to render the bottle image itself as well
             * as its contents, and it centers itself on the stage at an appropriate position.
             *
             * The bottle is responsible for all of the game logic that has to do with the board itself.
             *
             * @param stage the stage that will manage this entity/
             * @param parent the scene that owns us
             * @param color the color to render the bottle with
             */
            function Bottle(stage, parent, color) {
                // Calculate the dimensions of the bottle in pixels. This is inclusive of both the margins and
                // the inner contents area.
                var width = (BOTTLE_WIDTH + BOTTLE_MARGIN) * game.TILE_SIZE;
                var height = (BOTTLE_HEIGHT + BOTTLE_MARGIN) * game.TILE_SIZE;
                // Configure ourselves to be large and in charge. We center ourselves horizontally on the
                // stage and place our bottom against the bottom of the stage.
                _super.call(this, "Bottle", stage, (stage.width / 2) - (width / 2), stage.height - height, width, height, 1, { colorStr: color });
                // Save our parent scene.
                this._scene = parent;
                // Load our sounds
                this._sndSegmentDrop = stage.preloadSound("segment_drop");
                // Start our tick counts initialized.
                this._dropTicks = 0;
                // By default, we're not matching and nothing has been dropping.
                this._dropping = false;
                this._matching = false;
                // Construct the bottle polygon for later.
                this._bottlePolygon = this.getBottlePolygon();
                // Set up the position of the bottle contents to be half the horizontal and vertical margins
                // away from the top left corner.
                this._contentOffset = new game.Point((BOTTLE_MARGIN / 2) * game.TILE_SIZE, (BOTTLE_MARGIN / 2) * game.TILE_SIZE);
                // Fill the bottle contents with empty segments.
                this._contents = [];
                for (var i = 0; i < BOTTLE_WIDTH * BOTTLE_HEIGHT; i++)
                    this._contents[i] = new game.Segment(stage, game.SegmentType.EMPTY, game.SegmentColor.BLUE);
                // No viruses to start.
                this._virusCount = 0;
            }
            Object.defineProperty(Bottle.prototype, "properties", {
                get: function () { return this._properties; },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Bottle.prototype, "virusCount", {
                /**
                 * The number of viruses that currently exist in the bottle.
                 * @returns {number}
                 */
                get: function () { return this._virusCount; },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Bottle.prototype, "openingXPosition", {
                /**
                 * Get the column number in the bottle content area that corresponds to the location of the
                 * opening in the bottle.
                 *
                 * @returns {number}
                 */
                get: function () {
                    // NOTE: This does some math on the result because the opening segment provided includes the
                    // margins.
                    return BOTTLE_OPENING_SEGMENT - (BOTTLE_MARGIN / 2);
                },
                enumerable: true,
                configurable: true
            });
            /**
             * Given the current values for the bottle size, calculate and return a polygon that will render
             * the outline of the bottle.
             *
             * @returns {Polygon} the bottle polygon
             */
            Bottle.prototype.getBottlePolygon = function () {
                var retVal = [];
                // Alias half of a tile, since we're going to be using that a lot.
                var halfTile = (game.TILE_SIZE / 2);
                // The opening in the bottle is always exactly 2 segments wide (large enough for a single pill
                // to enter it), aligned to the segment boundary, and as close to being centered as possible.
                //
                // Calculate how many segments there are to the left and right of the bottle opening.
                var leftEdgeSegments = BOTTLE_OPENING_SEGMENT;
                var rightEdgeSegments = BOTTLE_WIDTH + BOTTLE_MARGIN - 2 - leftEdgeSegments;
                // Create an origin point.
                var point = new game.Point(0, 0);
                // Translate the p0int above by the values passed in, then store the new point into the return
                // value array as an array of two numbers.
                function storeOffset(xOffs, yOffs) {
                    point.translateXY(xOffs, yOffs);
                    retVal.push(point.toArray());
                }
                // The top left corner of the exterior of the bottle starts at the center of the segment that
                // the origin is in and goes down for the entire height less one segment (because the bottle
                // walls are half a segment in thickness.
                storeOffset(halfTile, halfTile);
                storeOffset(0, (BOTTLE_HEIGHT + BOTTLE_MARGIN - 1) * game.TILE_SIZE);
                // Now we go across for the width less one segment and back up.
                storeOffset((BOTTLE_WIDTH + BOTTLE_MARGIN - 1) * game.TILE_SIZE, 0);
                storeOffset(0, -(BOTTLE_HEIGHT + BOTTLE_MARGIN - 1) * game.TILE_SIZE);
                // Draw the top right side of the bottle. This requires us to move left, up, left, down and
                // right, which will end us 1/2 a tile (the thickness of the bottle walls) left and down from
                // where we started.
                storeOffset(-(rightEdgeSegments - 1) * game.TILE_SIZE, 0);
                storeOffset(0, -halfTile);
                storeOffset(-halfTile, 0);
                storeOffset(0, game.TILE_SIZE);
                storeOffset((rightEdgeSegments - 1) * game.TILE_SIZE, 0);
                // Now describe the interior of the bottle walls by going down, left and back up.
                storeOffset(0, BOTTLE_HEIGHT * game.TILE_SIZE);
                storeOffset(-BOTTLE_WIDTH * game.TILE_SIZE, 0);
                storeOffset(0, -BOTTLE_HEIGHT * game.TILE_SIZE);
                // Now describe the top left part of the bottle in the same manner as we did to the top right,
                // only we're starting on the inside and going out instead of the other way around.
                storeOffset((leftEdgeSegments - 1) * game.TILE_SIZE, 0);
                storeOffset(0, -game.TILE_SIZE);
                storeOffset(-halfTile, 0);
                storeOffset(0, halfTile);
                return retVal;
            };
            /**
             * This method is responsible for rendering the bottle image. This assumes that there is a total
             * margin (in tiles) or BOTTLE_MARGIN around the content area of the bottle, and that the rendering
             * of the bottle should thus take no more than (BOTTLE_MARGIN * TILE_WIDTH) / 2 pixels on each side.
             *
             * @param x the x location to render the bottle image at
             * @param y the y location to render the bottle image at
             * @param renderer the renderer to use to render the bottle.
             */
            Bottle.prototype.renderBottle = function (x, y, renderer) {
                // Let the super render our background for us so we can determine if the bounds of the bottle
                // object are correct or not.
                //super.render (x, y, renderer);
                // Translate the canvass to our rendering position and set up to fill with our bottle color.
                renderer.translateAndRotate(x, y);
                renderer.fillPolygon(this._bottlePolygon, this._properties.colorStr);
                renderer.restore();
            };
            /**
             * Render ourselves to the screen, along with our contents
             * @param x the X location to render at
             * @param y the Y location to render at
             * @param renderer the renderer to use to render ourselves
             */
            Bottle.prototype.render = function (x, y, renderer) {
                // Start by rendering the bottle.
                this.renderBottle(x, y, renderer);
                // Now iterate over our contents and render it out. Here we do a transform to put the origin
                // at the point on the canvas where the top left of the bottle interior is, so that we don't
                // have to do an extra translation for everything.
                renderer.translateAndRotate(x + this._contentOffset.x, y + this._contentOffset.y);
                for (var y_1 = 0, i = 0; y_1 < BOTTLE_HEIGHT; y_1++) {
                    for (var x_1 = 0; x_1 < BOTTLE_WIDTH; x_1++, i++) {
                        // Get the segment and render it.
                        var segment = this._contents[i];
                        segment.render(x_1 * game.TILE_SIZE, y_1 * game.TILE_SIZE, renderer);
                    }
                }
                renderer.restore();
            };
            /**
             * This gets invoked every frame prior to our render method being called.
             *
             * Here we see if it's time for the game state to advance, and if so, we do it.
             *
             * @param stage the stage that the actor is on
             * @param tick the game tick; this is a count of how many times the game loop has executed
             */
            Bottle.prototype.update = function (stage, tick) {
                // If we're currently displaying matches in the bottle and we've been waiting long enough, go
                // ahead and clear them out and then remove the flag so more drops can happen.
                if (this._matching && tick >= this._matchTicks + MATCH_DISPLAY_TICKS) {
                    // Scan over the entire bottle contents and replace all matched segments with empty ones.
                    for (var y = 0; y < BOTTLE_HEIGHT; y++) {
                        for (var x = 0; x < BOTTLE_WIDTH; x++) {
                            var segment = this.segmentAtXY(x, y);
                            if (segment.properties.type == game.SegmentType.MATCHED)
                                segment.properties.type = game.SegmentType.EMPTY;
                        }
                    }
                    // No longer matching, so start a drop operation to see if anything else needs to happen.
                    this._matching = false;
                    this._dropping = true;
                    this._dropTicks = -1;
                    // Now that all of the matches have been removed and dropping is going to start, tell the
                    // parent if the bottle is empty, because then it's time to go on to a new level.
                    if (this._virusCount == 0)
                        this._scene.bottleEmpty();
                }
                // If we have been told that we should be dropping things AND enough time has passed since the
                // last time we did a drop, then try to do a drop now.
                if (this._dropping == true && tick >= this._dropTicks + CONTENT_DROP_TICKS) {
                    // Do a gravity check to see if there is anything to move.
                    var didDrop = this.contentGravityStep();
                    // If we didn't drop anything, then it's time to check to see if there is a match because all
                    // falling segments have fallen as far as they can. The check function will turn off
                    // dropping and turn on match display if any are found.
                    if (didDrop == false)
                        this.checkForMatches();
                    // Now save the state of this operation for the next time, and save the tick count that we
                    // did this at, so that we know when to start again. This will either stop our drop or let
                    // us take another step.
                    this._dropping = didDrop;
                    this._dropTicks = tick;
                }
            };
            /**
             * The bottle responds to all triggers by checking for matches, which may also cause a drop.
             *
             * This is meant to be invoked every time the capsule that the player is moving around in the bottle
             * comes to rest, to see if any matches need to happen.
             *
             * @param activator ignored
             */
            Bottle.prototype.trigger = function (activator) {
                if (activator === void 0) { activator = null; }
                // Since we respond to triggers by checking for matches, which might cause a cascade, we first
                // set the cascade length to -1 (because every loop through checkMatches() increments it.
                //
                // Once that is done, we can check for matches.
                this._cascadeLength = -1;
                this.checkForMatches();
            };
            /**
             * Given a location in the bottle contents, return the segment object at that location, or null if
             * the location is not valid.
             *
             * @param x the X location in the bottle to get the segment for
             * @param y the Y location in the bottle to get the segment for
             * @returns {Segment} the segment at the given location, or null if that location is invalid
             */
            Bottle.prototype.segmentAtXY = function (x, y) {
                // If the location provided is not inside the contents of the bottle, then it is not empty space.
                if (x < 0 || y < 0 || x >= BOTTLE_WIDTH || y >= BOTTLE_HEIGHT)
                    return null;
                // Return empty status
                return this._contents[y * BOTTLE_WIDTH + x];
            };
            /**
             * Given a location in the bottle contents, return the segment object at that location, or null if
             * the location is not valid.
             *
             * The point provided needs to be in bottle content space (i.e. map coordinates), not stage
             * coordinates.
             *
             * @param position the location in the bottle to get the segment for
             * @returns {Segment} the segment at the given location, or null if that location is invalid
             */
            Bottle.prototype.segmentAt = function (position) {
                return this.segmentAtXY(position.x, position.y);
            };
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
            Bottle.prototype.isEmptyAtXY = function (x, y) {
                // Get the segment at the provided location. If we got one, return if it's empty. If the
                // location is invalid, the method returns null, in which case we assume that the space is not
                // empty.
                var segment = this.segmentAtXY(x, y);
                if (segment != null)
                    return segment.properties.type == game.SegmentType.EMPTY;
                return false;
            };
            /**
             * Given a location in the bottle contents, check to see if that position is empty or not.
             *
             * When the location provided is out of range for the bottle contents, false is always returned.
             *
             * The point provided needs to be in bottle content space (i.e. map coordinates), not stage
             * coordinates.
             *
             * @param position the location in the bottle to check
             * @returns {boolean} true if the segment at that position in the bottle is empty, or false if it
             * is not or the position is not inside the bottle
             */
            Bottle.prototype.isEmptyAt = function (position) {
                return this.isEmptyAtXY(position.x, position.y);
            };
            /**
             * This method takes a point that is in the coordinate system of the bottle contents and converts
             * it to be a stage position. In the bottle system, the point 0,0 is in the top left corner.
             *
             * This modifies the point provided in place.
             *
             * This allows points with negative positions and provides indexes outside of the bottle contents
             * area as a result. In practice this is probably useful only for getting capsules into the neck
             * of the bottle.
             *
             * @param position
             */
            Bottle.prototype.translateContentPosToStage = function (position) {
                // This is just a simple transformation in which we assuming the input is a tile position,
                // multiple it by the tile size to get it into the right domain, and then offset it by the
                // bottle position to get it into our entity area and again by the content offset to get it
                // into the content area.
                position.scale(game.TILE_SIZE).translate(this._contentOffset).translate(this._position);
            };
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
            Bottle.prototype.dropSegment = function (x, y) {
                // Calculate the offset of the segment provided and the segment below it.
                var topOffs = y * BOTTLE_WIDTH + x;
                var bottomOffs = (y + 1) * BOTTLE_WIDTH + x;
                // Swap the two values around.
                var temp = this._contents[bottomOffs];
                this._contents[bottomOffs] = this._contents[topOffs];
                this._contents[topOffs] = temp;
            };
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
            Bottle.prototype.contentGravityStep = function () {
                var didDrop = false;
                // Scan the entire contents of the bottle from left to right and top to bottom. We start from
                // the second row from the bottom, since the segments on the bottom can't move down anyway.
                for (var y = BOTTLE_HEIGHT - 2; y >= 0; y--) {
                    for (var x = 0; x < BOTTLE_WIDTH; x++) {
                        // Get the segment at the position we are currently considering.
                        var segment = this.segmentAtXY(x, y);
                        // Check and see if we are subject to gravity here. If we are not, we can skip to the
                        // next element.
                        //
                        // In particular, we are not susceptible to gravity when:
                        //   o This segment is not affected by gravity (e.g. a virus)
                        //   o The segment under us is not empty, so there is no place to fall
                        //   o We are a LEFT side capsule, but there is no empty space for our attached RIGHT
                        //     side to drop.
                        if (segment.canFall() == false || this.isEmptyAtXY(x, y + 1) == false ||
                            (segment.properties.type == game.SegmentType.LEFT &&
                                this.isEmptyAtXY(x + 1, y + 1) == false))
                            continue;
                        // Drop ourselves down, and then based on our type, possibly also drop down something
                        // else.
                        this.dropSegment(x, y);
                        switch (segment.properties.type) {
                            // When this segment is a left segment, we also need to drop the segment to our
                            // right, which should be a RIGHT.
                            case game.SegmentType.LEFT:
                                this.dropSegment(x + 1, y);
                                break;
                            // When this segment is a BOTTOM, we also need to drop the segment above us, which
                            // should be a TOP.
                            case game.SegmentType.BOTTOM:
                                this.dropSegment(x, y - 1);
                                break;
                        }
                        // Set the flag that indicates that we dropped at least one segment
                        didDrop = true;
                    }
                }
                // If anything dropped, play the sound associated with that.
                if (didDrop)
                    this._sndSegmentDrop.play();
                return didDrop;
            };
            /**
             * Mark the segment at the provided location as a matched segment by converting its segment type
             * to a MATCHED segment. This also takes care of transforming adjacent connected segments into the
             * appropriate type (e.g. if this is a LEFT, the RIGHT is turned into a SINGLE).
             *
             * If the segment at the given location is a virus, we decrement the number of viruses in the
             * bottle and increment the number of viruses found during the current match sequence.
             *
             * @param x the X position to transform
             * @param y the Y position to transform
             */
            Bottle.prototype.markSegment = function (x, y) {
                // Get the segment and then store its current type.
                var segment = this.segmentAtXY(x, y);
                var type = segment.properties.type;
                // If this segment is already a MATCHED segment, then leave without doing anything else, as
                // this was already taken care of as a part of the match somewhere else.
                if (type == game.SegmentType.MATCHED)
                    return;
                // If this segment is a virus, then decrement our virus count now because we are removing a virus.
                // We also need to increment the number of viruses found during this match.
                if (segment.properties.type == game.SegmentType.VIRUS) {
                    this._virusCount--;
                    this._virusMatchesFound++;
                }
                // Convert the segment to matched segment and then get the connected segment. This will return
                // null if the connected segment is out of bounds or if this segment can't have a connection
                // anyway.
                segment.properties.type = game.SegmentType.MATCHED;
                switch (type) {
                    case game.SegmentType.LEFT:
                        segment = this.segmentAtXY(x + 1, y);
                        break;
                    case game.SegmentType.RIGHT:
                        segment = this.segmentAtXY(x - 1, y);
                        break;
                    case game.SegmentType.TOP:
                        segment = this.segmentAtXY(x, y + 1);
                        break;
                    case game.SegmentType.BOTTOM:
                        segment = this.segmentAtXY(x, y - 1);
                        break;
                    // Nothing to fix up for any other segment
                    default:
                        segment = null;
                }
                // If we found a connected segment, mark it as a SINGLE as it is no longer a part of a
                // complete capsule.
                if (segment != null)
                    segment.properties.type = game.SegmentType.SINGLE;
            };
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
             * @returns {Point} the center point of the matched segments, in stage space
             */
            Bottle.prototype.markMatch = function (x, y, matchLength, horizontal) {
                // The number of segments we have marked so far
                var marked = 0;
                // Create a point that is the center of the rectangle that encompasses the segments that make
                // up the match. This is the top left of the current segment, converted to screen space.
                var matchPoint = new game.Point(x, y)
                    .scale(game.TILE_SIZE)
                    .translate(this._position)
                    .translate(this._contentOffset);
                // Now translate to the center. Depending on the orientation of the match, one direction is
                // half a tile and the other half is half of the match length converted to tiles.
                matchPoint.translateXY(horizontal ? ((matchLength * game.TILE_SIZE) / 2) : (game.TILE_SIZE / 2), horizontal ? (game.TILE_SIZE / 2) : ((matchLength * game.TILE_SIZE) / 2));
                // Keep looping until we have fixed as many things as we were told to mark.
                while (marked != matchLength) {
                    // If the X or Y is out of bounds, then just leave. This protects us against doing
                    // something quite stupid somewhere.
                    if (x < 0 || y < 0 || x >= BOTTLE_WIDTH || y >= BOTTLE_HEIGHT) {
                        console.log("markMatchSegments() passed invalid match to mark");
                        return matchPoint;
                    }
                    // Mark the item at the current position.
                    this.markSegment(x, y);
                    marked++;
                    // If this is a horizontal segment, increment X; otherwise increment Y
                    if (horizontal)
                        x++;
                    else
                        y++;
                }
                // Return the center of the match
                return matchPoint;
            };
            /**
             * Calculate the centroid of the two points passed in IN PLACE by MODIFYING point1. The center of
             * the two points is calculated and stored into point1, which is returned.
             *
             * Either or both points may be null. If  point2 is null, point1 is returned, if point1 is null,
             * either a copy of point2 or null is returned, depending on point2, or point1 is modified to be
             * the average of the two points and is also returned.
             *
             * @param point1 the first point to get the center of (the result is stored here)
             * @param point2 the second point to get the center of
             * @returns {Point} point1 after it has been modified to include the proper center of the two points,
             * or a copy of point2 if point1 is null, or null if point1 and point2 are also null.
             */
            Bottle.prototype.calculateCentroid = function (point1, point2) {
                // If there is no second point, just return the first point.
                if (point2 == null)
                    return point1;
                // If there is no first point, just return a copy of the second point if possible.
                if (point1 == null)
                    return point2 != null ? point2.copy() : null;
                // There are two points. Translate the first point by the second point to add them together,
                // then reduce it by half and return it, in order to calculate the average.
                point1.translate(point2);
                point1.scale(0.5);
                return point1;
            };
            /**
             * Scan the row of the bottle provided to see if there are any matches. For any matches of an
             * appropriate length, the matching segments are turned into a MATCHED segment.
             *
             * @param y the row in the bottle contents to check for matches
             * @returns {Point} the center point of the match or matches found, or null otherwise
             */
            Bottle.prototype.checkRowMatch = function (y) {
                // The center of the match or matches found, or null if no matches.
                var matchPoint = null;
                // Scan from left to right. We keep searching until we exceed the position on the right where
                // we know no more matches can be found because there are not enough positions left.
                var x = 0;
                while (x < BOTTLE_WIDTH - MATCH_LENGTH + 1) {
                    // Get the segment at this location.
                    var segment = this.segmentAtXY(x, y);
                    // If we're empty, then skip ahead to the next element; empty segments can't be a part of
                    // a match.
                    if (segment.properties.type == game.SegmentType.EMPTY) {
                        x++;
                        continue;
                    }
                    // See how many elements to the right we can go until we find an element that does not
                    // match this one.
                    var searchX = x + 1;
                    while (segment.matches(this.segmentAtXY(searchX, y)))
                        searchX++;
                    // Calculate how long the match is. If it's long enough, then we need to mark the match
                    // for all of those segments and then calculate the center of the match.
                    var matchLength = searchX - x;
                    if (matchLength >= MATCH_LENGTH) {
                        matchPoint = this.calculateCentroid(matchPoint, this.markMatch(x, y, matchLength, true));
                    }
                    // Restart the search now. Since we stopped at the first thing that was not a match with
                    // where we started, we start the next search from there.
                    x = searchX;
                }
                return matchPoint;
            };
            /**
             * Scan the column of the bottle provided to see if there are any matches. For any matches of an
             * appropriate length, the matching segments are turned into a MATCHED segment.
             *
             * @param x the column in the bottle contents to check for matches
             * @returns {Point} the center point of the match or matches found, or null otherwise
             */
            Bottle.prototype.checkColumnMatch = function (x) {
                // The center of the match or matches found, or null if no matches.
                var matchPoint = null;
                // Scan from left to right. We keep searching until we exceed the position on the right where
                // we know no more matches can be found because there are not enough positions left.
                var y = 0;
                while (y < BOTTLE_HEIGHT - MATCH_LENGTH + 1) {
                    // Get the segment at this location.
                    var segment = this.segmentAtXY(x, y);
                    // If we're empty, then skip ahead to the next element; empty segments can't be a part of
                    // a match.
                    if (segment.properties.type == game.SegmentType.EMPTY) {
                        y++;
                        continue;
                    }
                    // See how many elements downwards we can go until we find an element that does not match
                    // this one.
                    var searchY = y + 1;
                    while (segment.matches(this.segmentAtXY(x, searchY)))
                        searchY++;
                    // Calculate how long the match is. If it's long enough, then we need to mark the match
                    // for all of those segments and then set the flag that says that we found a match.
                    var matchLength = searchY - y;
                    if (matchLength >= MATCH_LENGTH) {
                        matchPoint = this.calculateCentroid(matchPoint, this.markMatch(x, y, matchLength, false));
                    }
                    // Restart the search now. Since we stopped at the first thing that was not a match with
                    // where we started, we start the next search from there.
                    y = searchY;
                }
                return matchPoint;
            };
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
            Bottle.prototype.checkForMatches = function () {
                // The center of the match or matches found, or null if no matches.
                var matchPoint = null;
                // Reset the number of viruses that were removed as a part of this match to be 0, and
                // increment the cascade length to count this as a potential cascade step (the length defaults
                // to -1 on every operation.
                this._virusMatchesFound = 0;
                this._cascadeLength++;
                // Check for matches first on the horizontal and then on the vertical.
                //
                // Every match found (if any) calculates the rolling center point of all found matches.
                for (var y = 0; y < BOTTLE_HEIGHT; y++)
                    matchPoint = this.calculateCentroid(matchPoint, this.checkRowMatch(y));
                // Now do the same thing with columns.
                for (var x = 0; x < BOTTLE_WIDTH; x++)
                    matchPoint = this.calculateCentroid(matchPoint, this.checkColumnMatch(x));
                // If we found at least one match, we need to stop any dropping from happening, set up the
                // flag that indicates that we are displaying matches, and then set the current time so that
                // the matches display for the proper amount of time before the update() method clears them
                // away for us.
                if (matchPoint) {
                    // Signal the game scene about what happened, so that it can accumulate score and such.
                    this._scene.matchMade(this._virusMatchesFound, this._cascadeLength, matchPoint);
                    // Now pause dropping so we can display the matches.
                    this._dropping = false;
                    this._matching = true;
                    this._matchTicks = this._stage.tick;
                }
                else {
                    // We were asked to find a match, but no matches are present. This could mean the end of a
                    // cascade or just a move that did nothing; either way, let the bottle know so it can
                    // continue.
                    this._scene.dropComplete();
                    // Reset the cascade length now.
                    this._cascadeLength = -1;
                }
            };
            /**
             * Given a position on the stage, this will determine if that position is inside the contents area
             * of this bottle or not. If it is, the segment that is under that position will be returned.
             * Otherwise, null is returned.
             *
             * @param stagePos the position to check
             * @returns {Segment} the segment at the provided position on the stage, or null if the position
             * is not inside the contents area of the bottle.
             */
            Bottle.prototype.segmentAtStagePosition = function (stagePos) {
                // If it's inside the bottle, we can do something with it.
                if (stagePos.x >= this._position.x + this._contentOffset.x &&
                    stagePos.y >= this._position.y + this._contentOffset.y &&
                    stagePos.x < this._position.x + this._width - this._contentOffset.x &&
                    stagePos.y < this._position.y + this._height - this._contentOffset.y) {
                    // Convert the position to a tile by first transforming the point to be relative to the
                    // origin of the screen and then constraining it to a tile dimension. We do this in a copy
                    // so as to not modify the point provided to us.
                    stagePos = stagePos.copyTranslatedXY(-this._position.x - this._contentOffset.x, -this._position.y - this._contentOffset.y)
                        .reduce(game.TILE_SIZE);
                    // Get the segment clicked on and twiddle its type.
                    return this._contents[stagePos.y * BOTTLE_WIDTH + stagePos.x];
                }
                // It's out of bounds.
                return null;
            };
            /**
             * Generate and insert a virus into the bottle. This replicates the original Dr. Mario virus
             * algorithm for the NES as defined at:
             *     https://tetrisconcept.net/wiki/Dr._Mario
             *
             * Per the algorithm, a location is randomly selected in the bottle, but various constraints are
             * placed on the proximity of like colored viruses to each other. As such it may happen that the
             * generated position is not valid for virus insertion, in which case the function returns without
             * doing anything.
             *
             * @param level the level of the game (controls maximum virus height in the bottle)
             * @param virusRemaining the number of viruses left to generate, including this one (controls the
             * color of the virus inserted)
             * @returns {boolean} true if it inserted a virus, or false if it was unable to insert one
             */
            Bottle.prototype.attemptInsertVirus = function (level, virusRemaining) {
                var _this = this;
                // The maximum row that the virus can be inserted into the bottle. This is a 0 based row index
                // where row 0 is the bottom of the bottle and the rows proceed upwards.
                //
                // This is indexed by the level number we're generating so that as levels get higher, the
                // level in the bottle rises, which increases the difficulty (along with the increase in drop
                // speed).
                //
                // This is based on a hard coded level range.
                var maximumVirusRow = [9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9,
                    10, 10, 11, 11, 12, 12];
                // When inserting a virus, the selected virus color is the number of remaining viruses modulo 4.
                // Since there are only 3 possible colors, for every fourth virus we generate a random integer
                // and use it to index this table. This provides a little bit of random variation in the levels
                // we generate.
                var virusSelect = [
                    game.SegmentColor.YELLOW, game.SegmentColor.RED, game.SegmentColor.BLUE,
                    game.SegmentColor.BLUE, game.SegmentColor.RED, game.SegmentColor.YELLOW,
                    game.SegmentColor.YELLOW, game.SegmentColor.RED, game.SegmentColor.BLUE,
                    game.SegmentColor.BLUE, game.SegmentColor.RED, game.SegmentColor.YELLOW,
                    game.SegmentColor.YELLOW, game.SegmentColor.RED, game.SegmentColor.BLUE,
                    game.SegmentColor.RED
                ];
                // Create a point that will be where the new virus is inserted. In use, the coordinates are 1
                // based and not 0 based, and the Y coordinate indexes from the bottom of the bottle and not
                // the top (i.e. a row of 1 is the bottom of the bottle).
                var virusPos = new game.Point(game.Utils.randomIntInRange(0, BOTTLE_WIDTH - 1), game.Utils.randomIntInRange(0, BOTTLE_HEIGHT - 1));
                // As long as the row is out of range for what the maximum allowed for the level is, generate
                // a new one.
                while (virusPos.y > maximumVirusRow[level])
                    virusPos.y = game.Utils.randomIntInRange(0, BOTTLE_HEIGHT - 1);
                // Now that we know we have a Y value that is within the possible bottle height restrictions,
                // modify it so that it represents a real bottle position. The value as it appears now
                // references the bottom of the bottle, so we need to make it a real row.
                virusPos.y = BOTTLE_HEIGHT - virusPos.y - 1;
                // Generate the virus color to insert, which uses the virus count remaining modulo 4, where the
                // result is the color to use.
                //
                // Every 4 viruses this results in a color that is not valid; in this case, we randomly generate
                // an integer in the range of 0 to 15 and use it to index the table above to select the color.
                //
                // This allows the color distribution of inserted viruses to be mostly even with a little bit of
                // random variation.
                var virusColor = virusRemaining % 4;
                if (virusColor == 3)
                    virusColor = virusSelect[game.Utils.randomIntInRange(0, 15)];
                /**
                 * Given an X and a Y in bottle contents space, fetch the segment that is there. If it is a
                 * virus, its color is inserted into the results array. If the space is empty or does not
                 * exist (outside the bounds of the bottle), nothing happens.
                 *
                 * @param x the X position in the bottle to check
                 * @param y the Y position in the bottle to check
                 * @param results the array to insert the color into.
                 */
                var getVirusColor = function (x, y, results) {
                    var segment = _this.segmentAtXY(x, y);
                    if (segment != null && segment.properties.type == game.SegmentType.VIRUS)
                        results.push(segment.properties.color);
                };
                /**
                 * Adjust the new virus position by advancing first to the right, then up.
                 *
                 * @returns {boolean} true if everything is OK or false if the position was adjusted right out
                 * of the bottle.
                 */
                function adjustVirusPosition() {
                    // Shift the column to the right. Once we go off the right hand side of the bottle, we
                    // need to reset back at the left side and go up one row.
                    virusPos.x++;
                    if (virusPos.x == BOTTLE_WIDTH) {
                        virusPos.x = 0;
                        virusPos.y--;
                    }
                    // Return false when we go off the top of the bottle or true when the position is still
                    // valid inside the bottle.
                    return virusPos.y >= 3;
                }
                /**
                 * Given an array of possible segment colors (which might be empty), check to see if the color
                 * provided is in the array, and return true or false accordingly.
                 *
                 * @param array the array to search
                 * @param color the color to check for
                 * @returns true if the color is in the array, false otherwise.
                 */
                function contains(array, color) {
                    for (var i = 0; i < array.length; i++) {
                        if (array[i] == color)
                            return true;
                    }
                    return false;
                }
                // As long as the virus position that we have selected is not empty, advance to the next
                // position.
                while (this.segmentAtXY(virusPos.x, virusPos.y).properties.type != game.SegmentType.EMPTY) {
                    if (adjustVirusPosition() == false)
                        return false;
                }
                // Get the colors of the viruses 2 cells away in all four directions to see what is around us.
                var existing = [];
                getVirusColor(virusPos.x - 2, virusPos.y, existing);
                getVirusColor(virusPos.x + 2, virusPos.y, existing);
                getVirusColor(virusPos.x, virusPos.y - 2, existing);
                getVirusColor(virusPos.x, virusPos.y + 2, existing);
                // If we found one of each virus in the positions around us, then we can't insert anything at
                // this location because that would put too many of the same color in close proximity.
                //
                // The original algorithm from the NES version would bump the position by one and then
                // continue, which might overwrite a virus. I don't like that idea, so we don't do that.
                // Instead, we just leave.
                if (contains(existing, game.SegmentColor.BLUE) &&
                    contains(existing, game.SegmentColor.RED) &&
                    contains(existing, game.SegmentColor.YELLOW))
                    return false;
                // We know that some virus is possible here, so cycle through them until we eventually find
                // the one that we're interested in.
                //
                // Per the original algorithm, this goes through the colors backwards instead of forwards.
                while (contains(existing, virusColor)) {
                    virusColor--;
                    if (virusColor < 0)
                        virusColor = game.SegmentColor.BLUE;
                }
                // We found a color that's OK, so get the segment and set it up as a virus, then indicate success.
                var virus = this.segmentAtXY(virusPos.x, virusPos.y);
                virus.type = game.SegmentType.VIRUS;
                virus.color = virusColor;
                virus.virusPolygon = game.Utils.randomIntInRange(0, 2);
                return true;
            };
            /**
             * Empty the entire contents of the bottle.
             *
             * The bottle starts out empty, but you probably want to empty it before starting a new level.
             */
            Bottle.prototype.emptyBottle = function () {
                // Make every segment in the bottle empty.
                for (var i = 0; i < BOTTLE_WIDTH * BOTTLE_HEIGHT; i++)
                    this._contents[i].properties.type = game.SegmentType.EMPTY;
                // No more viruses now.
                this._virusCount = 0;
                // Now that the bottle is empty, we are no longer matching or dropping anything, because
                // there's nothing left.
                this._dropping = false;
                this._matching = false;
            };
            /**
             * Insert a virus into the bottle. This can only be called while the bottle contains nothing but
             * viruses and empty space (i.e. when setting up a level for play).
             *
             * A random location will be calculated and a virus inserted. The color of the virus is somewhat
             * determined by the number of viruses that are left to be generated in the bottle, and the maximum
             * height that the virus is allowed to generate in the bottle is controlled by the game level number
             * (higher levels allow for higher virus placement).
             *
             * @param level the level the virus is for
             * @param virusRemaining the number of viruses that are left to generate for this level, including
             * the one that is about to be generated by this call
             */
            Bottle.prototype.insertVirus = function (level, virusRemaining) {
                // Constrain the level provided to the maximum allowed in the tables; once this point is
                // reached, no further height or viruses are allowed.
                if (level > 20)
                    level = 20;
                // Keep calling the private version of the function until it returns success. This is a super
                // hack because I'm too lazy at the moment to refactor the generation code always just
                // generate a virus before it returns.
                //noinspection StatementWithEmptyBodyJS
                while (this.attemptInsertVirus(level, virusRemaining) == false)
                    ;
                // Count this as a virus inserted.
                this._virusCount++;
            };
            /**
             * As a debugging aid, this causes the bottle to scan its contents and reset the number of viruses
             * that it thinks it contains. This is needed to make sure that the count remains correct while
             * the level is being edited.
             */
            Bottle.prototype.debugRecountViruses = function () {
                this._virusCount = 0;
                for (var y = 0; y < BOTTLE_HEIGHT; y++) {
                    for (var x = 0; x < BOTTLE_WIDTH; x++) {
                        if (this.segmentAtXY(x, y).properties.type == game.SegmentType.VIRUS)
                            this._virusCount++;
                    }
                }
            };
            return Bottle;
        })(game.Entity);
        game.Bottle = Bottle;
    })(game = nurdz.game || (nurdz.game = {}));
})(nurdz || (nurdz = {}));
var nurdz;
(function (nurdz) {
    var game;
    (function (game) {
        /**
         * This represents the different kinds of segments that there can be. The segment type controls how a
         * segment visually displays itself to the screen and how it interacts with other segments in the bottle.
         */
        (function (SegmentType) {
            /**
             * An empty segment; this one doesn't render at all, it's just all blank and stuff. As a result
             * it's also not affected by gravity because it's not there.
             */
            SegmentType[SegmentType["EMPTY"] = 0] = "EMPTY";
            /**
             * This segment is a virus. A virus is never subject to gravity and just remains suspended in the
             * bottle until it gets destroyed during the game by matching. Presumably this is due to the magic
             * of the spikes they have on their envelopes.
             */
            SegmentType[SegmentType["VIRUS"] = 1] = "VIRUS";
            /**
             * A simple capsule segment. This is what LEFT/RIGHT/TOP/BOTTOM turn into when their other attached
             * segment is destroyed during the game, leaving a single segment behind (hence the name).
             *
             * A segment of this type is always affected by gravity if there is an empty space below it because
             * it has nothing to hold it in place.
             */
            SegmentType[SegmentType["SINGLE"] = 2] = "SINGLE";
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
            SegmentType[SegmentType["LEFT"] = 3] = "LEFT";
            SegmentType[SegmentType["RIGHT"] = 4] = "RIGHT";
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
            SegmentType[SegmentType["TOP"] = 5] = "TOP";
            SegmentType[SegmentType["BOTTOM"] = 6] = "BOTTOM";
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
            SegmentType[SegmentType["MATCHED"] = 7] = "MATCHED";
            /**
             * This one is not valid and only here to tell us how many segment types there are, which is
             * important during debugging when we have to cycle between segments but otherwise is not
             * interesting.
             */
            SegmentType[SegmentType["SEGMENT_COUNT"] = 8] = "SEGMENT_COUNT";
        })(game.SegmentType || (game.SegmentType = {}));
        var SegmentType = game.SegmentType;
        /**
         * This controls the color that a segment renders as, as one of the three possible values.
         */
        (function (SegmentColor) {
            /**
             * Te segment renders in the yellow (weird) color.
             */
            SegmentColor[SegmentColor["YELLOW"] = 0] = "YELLOW";
            /**
             * The segment renders in the red (fever) color.
             */
            SegmentColor[SegmentColor["RED"] = 1] = "RED";
            /**
             * The segment renders in the blue (chill) color.
             */
            SegmentColor[SegmentColor["BLUE"] = 2] = "BLUE";
        })(game.SegmentColor || (game.SegmentColor = {}));
        var SegmentColor = game.SegmentColor;
        /**
         * The colors to use when rendering the segments. This is meant to be indexed by an instance of
         * SegmentColor, so make sure that the order of things line up (including having the correct number of
         * items) unless you want things to not work.
         *
         * @type {Array<string>}
         */
        var RENDER_COLORS = ['#cccc00', '#cc3300', '#0033cc'];
        /**
         * When we are asked to render ourselves as translucent, this is the amount of alpha that is used.
         * Larger values mean less transparent.
         *
         * @type {number}
         */
        var TRANSLUCENT_ALPHA = 0.35;
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
        var SEGMENT_SIZE = game.TILE_SIZE - 2;
        /**
         * The first variant of virus.
         *
         * @type {VirusModel}
         */
        var virusOne = {
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
        var virusTwo = {
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
        var virusThree = {
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
        var virusPolygonList = [virusOne, virusTwo, virusThree];
        /**
         * Everything that can be rendered inside of the bottle in the game is a segment of some sort, be it a
         * capsule portion, a virus or even just empty space.
         */
        var Segment = (function (_super) {
            __extends(Segment, _super);
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
            function Segment(stage, type, color) {
                // Call the super class. The only important part here is the stage. We don't care about our
                // position because something else tells us where to render, and our size is always
                // constrained by the size of tiles.
                //
                // Here we set the type and color parameters directly into our properties.
                _super.call(this, "Segment", stage, 1, 1, game.TILE_SIZE, game.TILE_SIZE, 1, {
                    type: type,
                    color: color,
                    visible: true
                }, {}, '#666666');
                // If this is a virus, we need to set the polygon too.
                if (type == SegmentType.VIRUS)
                    this.virusPolygon = game.Utils.randomIntInRange(0, 2);
            }
            Object.defineProperty(Segment.prototype, "properties", {
                get: function () { return this._properties; },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Segment.prototype, "type", {
                /**
                 * Get the currently selected segment type of this segment.
                 *
                 * @returns {SegmentType} the current segment type as taken from the properties.
                 */
                get: function () { return this._properties.type; },
                /**
                 * Change the segment type of this segment to be the new type. No bounds checking is done.
                 *
                 * @param type the new type of this segment, which is set into our properties.
                 */
                set: function (type) { this._properties.type = type; },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Segment.prototype, "color", {
                /**
                 * Get the color that this segment renders as when drawn.
                 *
                 * @returns {SegmentColor} the current segment color of this segment.
                 */
                get: function () { return this._properties.color; },
                /**
                 * Change the segment color of this segment to be the new color.
                 */
                set: function (color) {
                    this._properties.color = color;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Segment.prototype, "virusPolygon", {
                /**
                 * Get the numeric index of the polygon used to render this segment if it renders as a polygon.
                 *
                 * @returns {number} the polygon index.
                 */
                get: function () { return this._virusPolygon; },
                /**
                 * Change the polygon used to render this segment when it is rendered as a virus.
                 *
                 * @param poly the numeric value of the virus polygon to use. Out of range values are constrained
                 * to the extremes of the possible values.
                 */
                set: function (poly) {
                    // Range check the value and then store it.
                    if (poly < 0)
                        poly = 0;
                    if (poly > virusPolygonList.length - 1)
                        poly = virusPolygonList.length - 1;
                    // Store the new integer value, then set the value as appropriate.
                    this._virusPolygon = poly;
                    this._properties.poly = virusPolygonList[poly];
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Segment.prototype, "virusPolygonCount", {
                /**
                 * Returns the number of distinct virus polygons that can be applied to the virusPolygon property
                 * in order to vary their visual appearance. The values that can be applied to the virusPolygon
                 * property range from 0 to this value - 1.
                 *
                 * @returns {number} the total number of distinct virus polygon values.
                 */
                get: function () { return virusPolygonList.length; },
                enumerable: true,
                configurable: true
            });
            /**
             * Render ourselves as a virus using the virus polygon provided. This assumes that the rendering
             * context has already been translated to put the origin at the top left corner of the cell to render
             * the virus into.
             *
             * @param renderer the renderer to render the virus with
             */
            Segment.prototype.renderVirus = function (renderer) {
                // The eyes and mouth of the virus will be black except when the color of the virus itself
                // is blue, in which case we render it as a gray instead, to give better contrast.
                var vColor = '#000000';
                if (this._properties.color == SegmentColor.BLUE)
                    vColor = '#cccccc';
                // Render out all of the polygons now.
                renderer.fillPolygon(this._properties.poly.body, RENDER_COLORS[this._properties.color]);
                renderer.fillPolygon(this._properties.poly.leftEye, vColor);
                renderer.fillPolygon(this._properties.poly.rightEye, vColor);
                renderer.fillPolygon(this._properties.poly.mouth, vColor);
            };
            ;
            /**
             * Render ourselves as a capsule segment of some sort. This assumes that the rendering context has
             * already been translated to put the origin in the center of the cell that we are supposed to
             * render into, and that it has also been rotated to make the capsule segment we render (a RIGHT)
             * appear correctly.
             *
             * @param renderer the renderer to render the capsule segment with
             */
            Segment.prototype.renderCapsuleSegment = function (renderer) {
                // Alias the color that we're going to use to render
                var colorStr = RENDER_COLORS[this._properties.color];
                // How we render depends on our type.
                switch (this._properties.type) {
                    // A single segment capsule is just a circle centered in the cell.
                    case SegmentType.SINGLE:
                        renderer.fillCircle(0, 0, SEGMENT_SIZE / 2, colorStr);
                        return;
                    // A segment that is a part of a match. This is an intermediate state between when a match
                    // has been detected and when the segment is made empty.
                    case SegmentType.MATCHED:
                        renderer.fillCircle(0, 0, SEGMENT_SIZE / 3, colorStr);
                        renderer.fillCircle(0, 0, SEGMENT_SIZE / 4, '#000000');
                        renderer.fillCircle(0, 0, SEGMENT_SIZE / 5, colorStr);
                        return;
                    // The remainder of the cases are (or should be) one of the four capsule segments that are
                    // meant to be joined together to be a single capsule. This always renders as a right
                    // handed segment because we assume the canvas has been rotated as appropriate.
                    default:
                        // Draw the circular portion. This describes a half circle for a right hand capsule end.
                        renderer.context.fillStyle = colorStr;
                        renderer.context.beginPath();
                        renderer.context.arc(0, 0, SEGMENT_SIZE / 2, Math.PI * 1.5, Math.PI / 2);
                        renderer.context.fill();
                        // Now draw a little rectangle in the same color to fill out the pill. Note that we use
                        // TILE_SIZE for the X position and the width, but the segment size for the Y position
                        // and the height.  This is on purpose; SEGMENT_SIZE represents how big the pill capsule
                        // segments should be to allow for a boundary between adjacent pills, but we want the
                        // flat edge of the segments to butt up against the side of their bounding boxes so that
                        // when two halves are together they don't appear to have a seam.
                        renderer.fillRect(-game.TILE_SIZE / 2, -SEGMENT_SIZE / 2, game.TILE_SIZE / 2, SEGMENT_SIZE, colorStr);
                        return;
                }
            };
            /**
             * This is the core rendering routine. Based on our current type and color, we draw ourselves as
             * appropriate at the provided location.
             *
             * We can optionally render with some translucency, if desired. By default, this is not the case.
             *
             * @param x the X location to render to
             * @param y the Y location to render to
             * @param renderer the renderer to use to render ourselves
             * @param translucent true if we should render ourselves with some translucency, false otherwise
             */
            Segment.prototype.render = function (x, y, renderer, translucent) {
                if (translucent === void 0) { translucent = false; }
                // Leave if we're not visible.
                if (this._properties.visible == false)
                    return;
                // If we're debugging, invoke the super, which will render a background for us at our dimensions,
                // which we can use for debugging purposes to ensure that we're drawing correctly.
                if (this._properties.debug)
                    _super.prototype.render.call(this, x, y, renderer);
                // Based on our type, invoke the appropriate render method.
                switch (this._properties.type) {
                    // If we're empty, just return.
                    case SegmentType.EMPTY:
                        return;
                    // If we're a virus, then translate the canvas to the top left corner of the appropriate
                    // location, then render the virus, restore and return.
                    case SegmentType.VIRUS:
                        renderer.translateAndRotate(x, y, 0);
                        if (translucent)
                            renderer.context.globalAlpha = TRANSLUCENT_ALPHA;
                        this.renderVirus(renderer);
                        renderer.restore();
                        return;
                    // Everything else is a capsule segment of some sort. All of the capsule rendering requires
                    // the canvas to be translated to put the origin in the center of the cell, and some of the
                    // segments also require rotation. We piggyback the single on the item that doesn't require
                    // rotation, because it doesn't.
                    //
                    // Note that the angles are 90 degrees being down and not up because the origin of the canvas
                    // is in the top left, so the sign of the Y value is opposite to what is most intuitive.
                    case SegmentType.TOP:
                        renderer.translateAndRotate(x + (game.TILE_SIZE / 2), y + (game.TILE_SIZE / 2), 270);
                        break;
                    case SegmentType.BOTTOM:
                        renderer.translateAndRotate(x + (game.TILE_SIZE / 2), y + (game.TILE_SIZE / 2), 90);
                        break;
                    case SegmentType.LEFT:
                        renderer.translateAndRotate(x + (game.TILE_SIZE / 2), y + (game.TILE_SIZE / 2), 180);
                        break;
                    case SegmentType.RIGHT:
                    case SegmentType.SINGLE:
                    case SegmentType.MATCHED:
                        renderer.translateAndRotate(x + (game.TILE_SIZE / 2), y + (game.TILE_SIZE / 2), 0);
                        break;
                }
                // Set the alpha if we have been asked to render translucently. This will be reset when the
                // context gets restored, which is why it happens here after the above translate does an
                // implicit state save.
                if (translucent)
                    renderer.context.globalAlpha = TRANSLUCENT_ALPHA;
                // Now call our capsule rendering method to do the actual drawing, then restore before we return.
                this.renderCapsuleSegment(renderer);
                renderer.restore();
            };
            /**
             * Based on the type of the segment that this is, return whether or not this segment is susceptible
             * to gravity.
             *
             * Note that this tells you if something CAN fall, not if it SHOULD fall, because a segment has no
             * idea of what it might be adjacent to.
             *
             * @returns {boolean} true if this segment can be affected by gravity or false if it can not
             */
            Segment.prototype.canFall = function () {
                // Check based on type.
                switch (this._properties.type) {
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
            };
            /**
             * Compares some other segment to us to see if they constitute a match or not. This returns true
             * when the current segment an the passed in segment are both non-empty segments of the same color.
             *
             * @param other the other segment to check (can be null)
             */
            Segment.prototype.matches = function (other) {
                // If we didn't get another segment, or we did but we're not the same color, then we don't match.
                if (other == null || this._properties.color != other._properties.color)
                    return false;
                // We are the same color and both exist. If either one of us is EMPTY, we can't be a match
                // because empty doesn't match anything (it's empty).
                if (this._properties.type == SegmentType.EMPTY || other._properties.type == SegmentType.EMPTY)
                    return false;
                // We are both a non empty segment of the same color, we match.
                return true;
            };
            return Segment;
        })(game.Entity);
        game.Segment = Segment;
    })(game = nurdz.game || (nurdz.game = {}));
})(nurdz || (nurdz = {}));
var nurdz;
(function (nurdz) {
    var game;
    (function (game) {
        /**
         * This represents the different types of capsules that are possible.
         *
         * This represents all possible color combinations in all possible orientations (i.e. Red-Blue is
         * unique from Blue-Red). There are 9 such unique combinations.
         *
         * These combinations are laid out so that the colors on each side go in the standard color order of
         * YELLOW, RED and BLUE, so that we can do tricky things to extract the colors.
         */
        (function (CapsuleType) {
            CapsuleType[CapsuleType["YELLOW_YELLOW"] = 0] = "YELLOW_YELLOW";
            CapsuleType[CapsuleType["YELLOW_RED"] = 1] = "YELLOW_RED";
            CapsuleType[CapsuleType["YELLOW_BLUE"] = 2] = "YELLOW_BLUE";
            CapsuleType[CapsuleType["RED_YELLOW"] = 3] = "RED_YELLOW";
            CapsuleType[CapsuleType["RED_RED"] = 4] = "RED_RED";
            CapsuleType[CapsuleType["RED_BLUE"] = 5] = "RED_BLUE";
            CapsuleType[CapsuleType["BLUE_YELLOW"] = 6] = "BLUE_YELLOW";
            CapsuleType[CapsuleType["BLUE_RED"] = 7] = "BLUE_RED";
            CapsuleType[CapsuleType["BLUE_BLUE"] = 8] = "BLUE_BLUE";
        })(game.CapsuleType || (game.CapsuleType = {}));
        var CapsuleType = game.CapsuleType;
        /**
         * This represents the different orientations allowed for the capsule.
         */
        (function (CapsuleOrientation) {
            /**
             * The capsule is laid out horizontally. In this orientation, our position represents the left
             * side of the capsule.
             */
            CapsuleOrientation[CapsuleOrientation["HORIZONTAL"] = 0] = "HORIZONTAL";
            /**
             * The capsule is laid out vertically. In this orientation, our position represents the bottom end
             * of the capsule.
             */
            CapsuleOrientation[CapsuleOrientation["VERTICAL"] = 1] = "VERTICAL";
        })(game.CapsuleOrientation || (game.CapsuleOrientation = {}));
        var CapsuleOrientation = game.CapsuleOrientation;
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
        var Capsule = (function (_super) {
            __extends(Capsule, _super);
            /**
             * Construct a new capsule.
             *
             * @param stage the stage that will be used to render this segment
             * @param bottle the bottle that contains us
             * @param type the type of capsule to create; this specifies our color
             * @param orientation the orientation of the capsule
             */
            function Capsule(stage, bottle, type, orientation) {
                if (orientation === void 0) { orientation = CapsuleOrientation.HORIZONTAL; }
                // Call the super class. The only important part here is the stage. We don't care about our
                // position because something else tells us where to render, and our size is always
                // constrained by the size of tiles.
                //
                // Here we set the type and orientation parameters directly into our properties.
                _super.call(this, "Capsule", stage, 1, 1, game.TILE_SIZE * 2, game.TILE_SIZE, 1, {
                    type: type,
                    orientation: orientation,
                    visible: true
                }, {}, '#333333');
                // Save the bottle that we were provided.
                this._bottle = bottle;
                // Create our two segments and then call our update function to give them an appropriate color
                // and layout based on the parameters we were given.
                this._segments = [
                    new game.Segment(stage, game.SegmentType.LEFT, game.SegmentColor.BLUE),
                    new game.Segment(stage, game.SegmentType.RIGHT, game.SegmentColor.RED)
                ];
                this.updateSegments();
            }
            Object.defineProperty(Capsule.prototype, "properties", {
                get: function () { return this._properties; },
                enumerable: true,
                configurable: true
            });
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
            Capsule.prototype.render = function (x, y, renderer, translucent) {
                if (translucent === void 0) { translucent = false; }
                // If we're not visible, leave.
                if (this._properties.visible == false)
                    return;
                // First segment always renders at exactly the position specified, regardless of orientation.
                this._segments[0].render(x, y, renderer, translucent);
                // The second segment renders either to the right of this position or above it, depending on
                // orientation. When we render vertically and our position is 0, the top half is rendered
                // translucent to show that it will not be applied.
                if (this._properties.orientation == CapsuleOrientation.HORIZONTAL)
                    this._segments[1].render(x + game.TILE_SIZE, y, renderer, translucent);
                else
                    this._segments[1].render(x, y - game.TILE_SIZE, renderer, this._mapPosition.y == 0 || translucent);
            };
            /**
             * Set the stage position of this capsule; unlike the general Actor method of the same name, this
             * DOES NOT modify the map location of the capsule in any way.
             *
             * @param x the new X position on the stage
             * @param y the new Y position on the stage
             */
            Capsule.prototype.setStagePositionXY = function (x, y) {
                // Set the stage position but otherwise do nothing; the super version of this also sets our
                // map position, which we don't want it to do.
                this._position.setToXY(x, y);
            };
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
            Capsule.prototype.setMapPositionXY = function (x, y) {
                // First, save the position as we were given it.
                this._mapPosition.setToXY(x, y);
                // Now copy this to the stage position and get the bottle to modify it to be in the correct
                // stage location/
                this._position.setToXY(x, y);
                this._bottle.translateContentPosToStage(this._position);
            };
            /**
             * This method updates the internal segments that make up the capsule based on the current
             * settings of the properties.
             *
             * This should be invoked whenever the orientation and/or type of the capsule changes, so that it
             * renders appropriately.
             */
            Capsule.prototype.updateSegments = function () {
                // First, set the segment types as appropriate. When we're horizontal they go left/right,
                // otherwise they go bottom/top (the first segment is always either the left or bottom,
                // respectively).
                if (this._properties.orientation == CapsuleOrientation.HORIZONTAL) {
                    this._segments[0].properties.type = game.SegmentType.LEFT;
                    this._segments[1].properties.type = game.SegmentType.RIGHT;
                }
                else {
                    this._segments[0].properties.type = game.SegmentType.BOTTOM;
                    this._segments[1].properties.type = game.SegmentType.TOP;
                }
                // Now, set the colors of the two segments as appropriate. We have carefully laid out the
                // capsule type enum so that the colors always go in the same order as the colors in the
                // segment class (which are laid out that way to make virus insertion easier).
                //
                // Due to this layout, a modulo operation tells us the color on the right hand side and an
                // integer division gives us the color on the left side.
                this._segments[0].properties.color = Math.floor(this._properties.type / 3);
                this._segments[1].properties.color = this._properties.type % 3;
            };
            /**
             * Check to see if this capsule can drop down into the bottle based on its current position or not.
             *
             * This checks the content of the bottle below our current position to see if it is empty or not,
             * taking our orientation into account, and returns an appropriate value.
             *
             * @returns {boolean} true if the capsule can drop down from its current position, or false otherwise.
             */
            Capsule.prototype.canDrop = function () {
                // If we are horizontal and the bottle position underneath our right side is not empty, we
                // can't drop.
                if (this._properties.orientation == CapsuleOrientation.HORIZONTAL &&
                    this._bottle.isEmptyAtXY(this._mapPosition.x + 1, this._mapPosition.y + 1) == false)
                    return false;
                // We can drop if the space below us is empty.
                return this._bottle.isEmptyAtXY(this._mapPosition.x, this._mapPosition.y + 1) == true;
            };
            /**
             * Drop the capsule down in the bottle, if it is allowed to do so.
             *
             * @returns {boolean} true if the capsule actually dropped, or false otherwise
             */
            Capsule.prototype.drop = function () {
                // If we can drop, set our new map position. This will cause the stage position to be
                // recalculated so that we actually visually change our location.
                if (this.canDrop()) {
                    this.setMapPositionXY(this._mapPosition.x, this._mapPosition.y + 1);
                    return true;
                }
                return false;
            };
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
            Capsule.prototype.canSlide = function (left) {
                // If we're a horizontal capsule, we can slide left if the position immediately to our left is
                // clear, and we can slide right if the position two to the right of us is empty.
                if (this._properties.orientation == CapsuleOrientation.HORIZONTAL)
                    return this._bottle.isEmptyAtXY(this._mapPosition.x + (left ? -1 : 2), this._mapPosition.y) == true;
                // We are vertical, so we need to make sure that our upper and lower segments are both not
                // obstructed.
                //
                // We are allowed to be vertical with our position at the top of the bottle, which puts our
                // upper segment outside the bottle content area. In this case we only need to check the
                // bottom; if we try to do the check, the bottle will return false because the row is outside
                // the content area of the bottle.
                return (this._mapPosition.y == 0 ||
                    this._bottle.isEmptyAtXY(this._mapPosition.x + (left ? -1 : 1), this._mapPosition.y - 1) == true) &&
                    this._bottle.isEmptyAtXY(this._mapPosition.x + (left ? -1 : 1), this._mapPosition.y) == true;
            };
            /**
             * Slide the capsule in the bottle, if it is allowed to do so.
             *
             * @param left true to slide left or false for a right slide
             * @returns {boolean} true if the capsule actually slid, or false otherwise
             */
            Capsule.prototype.slide = function (left) {
                // If we can slide, set our new map position. This will cause the stage position to be
                // recalculated so that we actually visually change our location.
                if (this.canSlide(left)) {
                    if (left)
                        this.setMapPositionXY(this._mapPosition.x - 1, this._mapPosition.y);
                    else
                        this.setMapPositionXY(this._mapPosition.x + 1, this._mapPosition.y);
                    return true;
                }
                return false;
            };
            /**
             * Check to see if the capsule can rotate in the bottle or not. The parameter controls what
             * direction the rotation goes.
             *
             * @param left true to check for a left rotation or false to check for a right rotation
             * @returns {boolean} true if the rotation can happen or false if it cannot
             */
            Capsule.prototype.canRotate = function (left) {
                // When we are a horizontal capsule, the check for rotation is easy.
                //
                // Regardless of the direction of the rotation, we always shift the right hand side to be
                // directly above our position; there is no lateral movement during a rotation to vertical.
                //
                // Rotation is always allowed when the capsule position is the top of the bottle, so we need
                // to always return true in that case because the bottle will return false for the isEmpty
                // check due to it being outside the bounds of the bottle.
                if (this._properties.orientation == CapsuleOrientation.HORIZONTAL)
                    return this._mapPosition.y == 0 ||
                        this._bottle.isEmptyAtXY(this._mapPosition.x, this._mapPosition.y - 1);
                // This must be a vertical capsule. Here the rotation direction doesn't really matter, as
                // there are only three possible outcomes:
                //  1) The position immediately to our right is clear, we will rotate there
                //  2) the position to our right is blocked but the position to our left is open, we will
                //     rotate and "wall kick" one position to the left
                //  3) We can't rotate
                //
                // As such, here we return true if it is clear either to our left or to our right.
                return this._bottle.isEmptyAtXY(this._mapPosition.x + 1, this._mapPosition.y) ||
                    this._bottle.isEmptyAtXY(this._mapPosition.x - 1, this._mapPosition.y);
            };
            /**
             * Rotate the capsule in the direction provided, if it is allowed to do so.
             *
             * Rotating takes the capsule from a horizontal to a vertical orientation, but can also slightly
             * bump its location in the bottle if the circumstances are right. For example, if the capsule is
             * against the side of the bottle in a vertical orientation and rotates towards the bottle edge,
             * it will get kicked away from the wall to rotate (if there is room)
             *
             * @param left true to rotate to the left, or false to rotate to the right
             * @returns {boolean} true if the rotation actually happened or not
             */
            Capsule.prototype.rotate = function (left) {
                // If we can't rotate in the direction asked for, return false right now.
                if (this.canRotate(left) == false)
                    return false;
                // What orientation are we in? This determines what we do.
                if (this._properties.orientation == CapsuleOrientation.HORIZONTAL) {
                    // Change our orientation to be vertical.
                    this._properties.orientation = CapsuleOrientation.VERTICAL;
                    // A rotate to the left (counter-clockwise) doesn't require any extra work; our right side
                    // goes above us and we're good to go.
                    //
                    // Rotating to the right requires a bit more work. Here what is currently the left becomes
                    // the top. This requires us to change our type to the reflection of what it currently is
                    // (blue-red to red-blue, for example).
                    //
                    // Since there are three colors, we can do what we would normally do to extract the left
                    // and right colors and then multiply the right color by 3 to get the left color, adding
                    // it to what the current right color is.
                    if (left == false) {
                        this._properties.type = ((this._properties.type % 3) * 3) +
                            Math.floor(this._properties.type / 3);
                    }
                }
                else {
                    // Change our orientation to be horizontal.
                    this._properties.orientation = CapsuleOrientation.HORIZONTAL;
                    // We are going from a vertical to a horizontal orientation. If the position to our right
                    // is not empty, we are getting wall kicked to the left, so update our position accordingly.
                    if (this._bottle.isEmptyAtXY(this._mapPosition.x + 1, this._mapPosition.y) == false)
                        this.setMapPositionXY(this._mapPosition.x - 1, this._mapPosition.y);
                    // A rotate to the right for a horizontal keeps everything the way it currently is color
                    // wise (the opposite of above), but a rotation to the left swaps our colors around.
                    if (left) {
                        this._properties.type = ((this._properties.type % 3) * 3) +
                            Math.floor(this._properties.type / 3);
                    }
                }
                // Update our segments so that they match our new rotation and color scheme, then return success.
                this.updateSegments();
                return true;
            };
            /**
             * Copy the defining properties of the source segment to the destination segment provided, so that
             * the destination becomes the same type of segment.
             *
             * If the destination segment is null, nothing happens.
             *
             * @param source the segment to copy
             * @param destination the segment to copy properties to, or null to do nothing
             */
            Capsule.prototype.copySegmentInfo = function (source, destination) {
                if (destination) {
                    // Copy type and color over. Since we're part of a capsule, we will never be a virus so we
                    // don't need to propagate the virus polygon over.
                    destination.properties.type = source.properties.type;
                    destination.properties.color = source.properties.color;
                }
            };
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
            Capsule.prototype.apply = function () {
                // Get the segment at our direct position and then copy our first segment into it.
                var segment = this._bottle.segmentAt(this._mapPosition);
                this.copySegmentInfo(this._segments[0], segment);
                // If we are vertical and our position is 0 on the Y axis, then our top segment is outside of
                // the bottle. In this case, when we apply we should actually apply as a single segment and not
                // a bottom, because the top part of the capsule got "cut off".
                //
                // This replicates how the original Dr. Mario handles this situation/
                if (this._properties.orientation == CapsuleOrientation.VERTICAL && this._mapPosition.y == 0) {
                    // Change the segment to be a single segment, and then leave because there's nothing else to
                    // do in this situation.
                    segment.properties.type = game.SegmentType.SINGLE;
                    return;
                }
                // Get the other segment for our other capsule end. This is either to the right of us or above
                // us depending on our orientation.
                if (this._properties.orientation == CapsuleOrientation.HORIZONTAL)
                    segment = this._bottle.segmentAtXY(this._mapPosition.x + 1, this._mapPosition.y);
                else
                    segment = this._bottle.segmentAtXY(this._mapPosition.x, this._mapPosition.y - 1);
                // Copy it over now.
                this.copySegmentInfo(this._segments[1], segment);
            };
            return Capsule;
        })(game.Entity);
        game.Capsule = Capsule;
    })(game = nurdz.game || (nurdz.game = {}));
})(nurdz || (nurdz = {}));
var nurdz;
(function (nurdz) {
    var game;
    (function (game) {
        /**
         * This entity represents a simplistic pointer, which is just a tile sized entity that appears to
         * slowly flash and points downwards. It's used for our debug logic.
         */
        var Pointer = (function (_super) {
            __extends(Pointer, _super);
            /**
             * Create the pointer object to be owned by the stage.
             *
             * @param stage the stage that owns this pointer
             * @param x the X location of the pointer
             * @param y the Y location of the pointer`
             * @param rotation the rotation of the pointer initially.
             */
            function Pointer(stage, x, y, rotation) {
                if (rotation === void 0) { rotation = 0; }
                _super.call(this, "Cursor", stage, x, y, game.TILE_SIZE, game.TILE_SIZE, 1, {
                    visible: true,
                    rotation: rotation
                });
                /**
                 * The index into the color list that indicates what color to render ourselves.
                 *
                 * @type {number}
                 */
                this._colorIndex = 0;
                /**
                 * The list of colors that we use to display ourselves.
                 *
                 * @type {Array<string>}
                 */
                this._colors = ['#ffffff', '#aaaaaa'];
                /**
                 * The polygon that represents us.
                 *
                 * @type {Polygon}
                 */
                this._poly = [
                    [-(game.TILE_SIZE / 2) + 4, -(game.TILE_SIZE / 2) + 4],
                    [(game.TILE_SIZE / 2) - 4, 0],
                    [-(game.TILE_SIZE / 2) + 4, (game.TILE_SIZE / 2) - 4],
                ];
            }
            Object.defineProperty(Pointer.prototype, "properties", {
                get: function () { return this._properties; },
                enumerable: true,
                configurable: true
            });
            /**
             * Called every frame to update ourselves. This causes our color to change.
             *
             * @param stage the stage that the actor is on
             * @param tick the game tick; this is a count of how many times the game loop has executed
             */
            Pointer.prototype.update = function (stage, tick) {
                if (tick % 7 == 0) {
                    this._colorIndex++;
                    if (this._colorIndex == this._colors.length)
                        this._colorIndex = 0;
                }
            };
            /**
             * Render ourselves as an arrow rotated in the direction that we are rotated for.
             *
             * @param x the X location of where to draw ourselves
             * @param y the Y location of where to draw ourselves
             * @param renderer the renderer to use to draw ourselves
             */
            Pointer.prototype.render = function (x, y, renderer) {
                // Only render if we're visible.
                if (this._properties.visible) {
                    // Get ready for rendering. The X, Y we get is our upper left corner but in order to
                    // render properly we need it to be our center.
                    renderer.translateAndRotate(x + (game.TILE_SIZE / 2), y + (game.TILE_SIZE / 2), this._properties.rotation);
                    renderer.fillPolygon(this._poly, this._colors[this._colorIndex]);
                    renderer.restore();
                }
            };
            return Pointer;
        })(game.Entity);
        game.Pointer = Pointer;
    })(game = nurdz.game || (nurdz.game = {}));
})(nurdz || (nurdz = {}));
var nurdz;
(function (nurdz) {
    var game;
    (function (game) {
        /**
         * This class represents a menu. This is responsible for rendering menu items and handling key input
         * while a menu is active.
         */
        var Menu = (function (_super) {
            __extends(Menu, _super);
            /**
             * Construct a new menu which renders its menu text with the font name and size provided.
             *
             * @param stage the stage that will display this menu
             * @param fontName the font name to render the menu with
             * @param fontSize the size of the font to use to render items, in pixels
             * @param sound the sound to play when the menu selection changes.
             */
            function Menu(stage, fontName, fontSize, sound) {
                if (sound === void 0) { sound = null; }
                // Simple super call. We don't have a visual position per se.
                _super.call(this, "Menu", stage, 0, 0, 0, 0);
                // Store the values provided.
                this._fontName = fontName;
                this._fontSize = fontSize;
                this._selectSound = sound;
                // Combine them together into a single string for later use
                this._fontFullSpec = this._fontSize + "px " + this._fontName;
                // The menu starts out empty.
                this._items = [];
                this._selected = 0;
                // Set up the pointer.
                this._pointer = new game.Pointer(stage, 0, 0);
            }
            Object.defineProperty(Menu.prototype, "selected", {
                /**
                 * Return the menu item index at the currently selected location.
                 *
                 * @returns {number}
                 */
                get: function () { return this._selected; },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Menu.prototype, "length", {
                /**
                 * Return the number of items that are currently in the menu.
                 *
                 * @returns {number}
                 */
                get: function () { return this._items.length; },
                enumerable: true,
                configurable: true
            });
            /**
             * Change the location of the menu pointer to point to the currently selected menu item.
             */
            Menu.prototype.updateMenuPointer = function () {
                if (this._items.length > 0)
                    this._pointer.setStagePositionXY(this._items[this._selected].position.x, this._items[this._selected].position.y);
            };
            /**
             * Add a new menu item to the list of menu items managed by this menu instance.
             *
             * @param text the text of the menu item
             * @param position the position on the screen of this item.
             */
            Menu.prototype.addItem = function (text, position) {
                // Insert the menu item
                this._items.push({
                    text: text,
                    position: position
                });
                // If the current length of the items array is now 1, the first item is finally here, so
                // position our pointer.
                if (this._items.length == 1)
                    this.updateMenuPointer();
            };
            /**
             * Return the menu item at the provided index, which will be null if the index provided is out of
             * range of the number of items currently maintained in the menu.
             *
             * @param index the index of the item to get
             * @returns {MenuItem} the menu item at the provided index or null if the index is not valid.
             */
            Menu.prototype.getItem = function (index) {
                if (index < 0 || index >= this._items.length)
                    return null;
                return this._items[index];
            };
            /**
             * Change the selected menu item to the previous item, if possible.
             *
             * If a sound is associated with the menu, it will be played.
             */
            Menu.prototype.selectPrevious = function () {
                this._selected--;
                if (this._selected < 0)
                    this._selected = this._items.length - 1;
                this.updateMenuPointer();
                if (this._selectSound != null)
                    this._selectSound.play();
            };
            /**
             * Change the selected menu item to the next item, if possible.
             *
             * If a sound is associated with the menu, it will be played.
             */
            Menu.prototype.selectNext = function () {
                this._selected++;
                if (this._selected >= this._items.length)
                    this._selected = 0;
                this.updateMenuPointer();
                if (this._selectSound != null)
                    this._selectSound.play();
            };
            /**
             * Update the state of the menu based on the current tick; we use this to visually mark the
             * currently selected menu item.
             *
             * @param stage the stage that owns us
             * @param tick the current update tick
             */
            Menu.prototype.update = function (stage, tick) {
                // Make sure our pointer updates
                this._pointer.update(stage, tick);
            };
            /**
             * Render ourselves using the provided renderer. This will render out the text as well as the
             * current pointer.
             *
             * The position provided to us is ignored; we already have an idea of where exactly our contents
             * will render.
             */
            Menu.prototype.render = function (x, y, renderer) {
                // Render the pointer at its current position.
                this._pointer.render(this._pointer.position.x, this._pointer.position.y, renderer);
                // Save the context and set up our font and font rendering.
                renderer.context.save();
                renderer.context.font = this._fontFullSpec;
                renderer.context.textBaseline = "middle";
                // Render all of the text items. We offset them by the width of the pointer that indicates
                // which item is the current item, with a vertical offset that is half of its height. This
                // makes the point on the pointer align with the center of the text.
                for (var i = 0; i < this._items.length; i++) {
                    var item = this._items[i];
                    renderer.drawTxt(item.text, item.position.x + game.TILE_SIZE, item.position.y + (game.TILE_SIZE / 2), 'white');
                }
                renderer.restore();
            };
            return Menu;
        })(game.Actor);
        game.Menu = Menu;
    })(game = nurdz.game || (nurdz.game = {}));
})(nurdz || (nurdz = {}));
var nurdz;
(function (nurdz) {
    var game;
    (function (game) {
        /**
         * The font that we use to render our text. If you update this, update the size in FONT_SIZE too.
         *
         * @type {string}
         */
        var FONT = "32px monospace";
        /**
         * An entity that represents simple floating text. It renders centered on its location and slowly
         * rises before vanishing.
         */
        var FloatingText = (function (_super) {
            __extends(FloatingText, _super);
            /**
             * Construct a new instance of floating text with an initial position and text. This can be
             * changed at any point to different text as needed.
             *
             * Instances of this class are created hidden and float upwards with a set speed and vanish after
             * a certain time; They also render centered on their location.
             *
             * When the visibility property is set to true, the position slowly floats upward at a set speed;
             * when false, no updates happen.
             *
             * @param stage the stage that manages us
             * @param x the initial X position of the text
             * @param y the initial Y position of the text
             * @param text the text to display
             */
            function FloatingText(stage, x, y, text) {
                _super.call(this, "Floaty", stage, x, y, 1, 1, 10, {}, {
                    visible: false,
                    life: 30,
                    speed: 2
                }, 'magenta');
                // Set our text.
                this._text = text;
            }
            Object.defineProperty(FloatingText.prototype, "properties", {
                get: function () { return this._properties; },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(FloatingText.prototype, "text", {
                /**
                 * Set the text that we display when we render ourselves.
                 *
                 * @param newText
                 */
                set: function (newText) { this._text = newText; },
                enumerable: true,
                configurable: true
            });
            /**
             * Update the state of the text; this will only do something while the text is visible, and after
             * a set time it will make itself invisible.
             *
             * @param stage the stage that owns us
             * @param tick the current game tick
             */
            FloatingText.prototype.update = function (stage, tick) {
                // If our life is greater than 0, then decrement it. When it hits 0, we make ourselves invisible.
                if (this._properties.life > 0) {
                    this._properties.life--;
                    if (this._properties.life == 0)
                        this._properties.visible = false;
                }
                // If we're not visible, leave.
                if (this._properties.visible == false)
                    return;
                // Shift our position upwards by the speed.
                this._position.translateXY(0, -this._properties.speed);
            };
            /**
             * Render ourselves, if we are currently visible. This renders the text centered horizontally and
             * vertically on the stage at the position given.
             *
             * @param x the X position to render at
             * @param y the Y position to render at
             * @param renderer the renderer to render ourselves with
             */
            FloatingText.prototype.render = function (x, y, renderer) {
                // If we're not visible, leave.
                if (this._properties.visible == false)
                    return;
                // Translate the origin to the position we want to render to
                renderer.translateAndRotate(x, y);
                // Set the font and indicate that the text should be centered in both directions.
                renderer.context.font = FONT;
                renderer.context.textAlign = "center";
                renderer.context.textBaseline = "middle";
                // Draw the text and restore the context.
                renderer.drawTxt(this._text, 0, 0, 'green');
                renderer.restore();
            };
            return FloatingText;
        })(game.Entity);
        game.FloatingText = FloatingText;
    })(game = nurdz.game || (nurdz.game = {}));
})(nurdz || (nurdz = {}));
var nurdz;
(function (nurdz) {
    var game;
    (function (game) {
        /**
         * The font that is used for the title font.
         *
         * @type {string}
         */
        var TITLE_FONT = "96px Arial,Serif";
        /**
         * The font that is used for our informative text.
         *
         * @type {string}
         */
        var INFO_FONT = "32px Arial,Serif";
        /**
         * The font that is used to display our menu text.
         * @type {string}
         */
        var MENU_FONT = "40px Arial,Serif";
        /**
         * This class represents the title screen. It allows the user to select the level that the game will
         * be played at.
         */
        var TitleScreen = (function (_super) {
            __extends(TitleScreen, _super);
            /**
             * Construct the title screen scene.
             *
             * @param stage the stage that controls us
             */
            function TitleScreen(stage) {
                // Let the super do some setup
                _super.call(this, "titleScreen", stage);
                // Preload all of our resources.
                this._music = stage.preloadMusic("BitQuest");
                this._sndLevelChange = stage.preloadSound("menu_select");
                // Set up our menu.
                this._menu = new game.Menu(stage, "Arial,Serif", 40, stage.preloadSound("menu_select"));
                this._menu.addItem("Level: 0", new game.Point(150, 400));
                this._menu.addItem("Start Game", new game.Point(150, 450));
                // Make sure it gets render and update requests.
                this.addActor(this._menu);
                // default level.
                this._level = 0;
            }
            Object.defineProperty(TitleScreen.prototype, "level", {
                /**
                 * Get the level that the game is currently at. In this scene, this represents the level that the
                 * next game will be started at. It defaults to 0, gets modified by the user, and after a game it
                 * gets set to the last level achieved (although it caps at 20).
                 */
                get: function () { return this._level; },
                enumerable: true,
                configurable: true
            });
            /**
             * This is invoked when we become the active scene. If the scene that came before us has a level
             * property, we use it to set our own level property. This allows us to return to the menu and
             * have the player easily go back to where they started.
             *
             * @param previousScene the scene that used to be active.
             */
            TitleScreen.prototype.activating = function (previousScene) {
                // Let the super debug log for us
                _super.prototype.activating.call(this, previousScene);
                // Start our music playing.
                this._music.play();
                // Does the previous scene have a level property?
                if (previousScene["level"] != undefined) {
                    // Yes, use it to set our level. We cap at 20 as far as allowing the player to start where
                    // they left off.
                    this._level = previousScene["level"];
                    if (this._level > 20)
                        this._level = 20;
                    this.updateMenu();
                }
            };
            /**
             * Triggers when we are no longer the active scene.
             *
             * @param nextScene the scene that is going to become active.
             */
            TitleScreen.prototype.deactivating = function (nextScene) {
                // Let the super do things so we get debug messages.
                _super.prototype.deactivating.call(this, nextScene);
                // Pause our music playback.
                this._music.pause();
            };
            /**
             * This helper updates our menu to show what the currently selected level is.
             */
            TitleScreen.prototype.updateMenu = function () {
                var item = this._menu.getItem(0);
                if (item)
                    item.text = "Level: " + this._level;
                // Play the sound that shows that the menu selection changed.
                this._sndLevelChange.play();
            };
            /**
             * Render the name of the game to the screen.
             */
            TitleScreen.prototype.renderTitle = function () {
                this._renderer.translateAndRotate(this._stage.width / 2, 45);
                // Set the font and indicate that the text should be centered in both directions.
                this._renderer.context.font = TITLE_FONT;
                this._renderer.context.textAlign = "center";
                this._renderer.context.textBaseline = "middle";
                // Draw the text and restore the context.
                this._renderer.drawTxt("Rx", 0, 0, 'white');
                this._renderer.restore();
            };
            /**
             * Render our info text to the screen.
             */
            TitleScreen.prototype.renderInfoText = function () {
                // The info text that we generate to the screen to explain what we are.
                var infoText = [
                    "A simple Dr. Mario clone",
                    "",
                    "Coded during #devember 2015 by Terence Martin",
                    "as an experiment in TypeScript and #gamedev",
                    "",
                    "Feel free to use this code as you see fit. See the",
                    "LICENSE file for details"
                ];
                // Save the context state and then set our font and vertical font alignment.
                this._renderer.translateAndRotate(game.TILE_SIZE, 132);
                this._renderer.context.font = INFO_FONT;
                this._renderer.context.textBaseline = "middle";
                // Draw the text now
                for (var i = 0, y = 0; i < infoText.length; i++, y += game.TILE_SIZE)
                    this._renderer.drawTxt(infoText[i], 0, y, '#c8c8c8');
                // We can restore now.
                this._renderer.restore();
            };
            /**
             * Invoked to render us. We clear the screen, show some intro text, and we allow the user to
             * select a starting level.
             */
            TitleScreen.prototype.render = function () {
                // Clear the screen and render all of our text.
                this._renderer.clear('black');
                this.renderTitle();
                this.renderInfoText();
                // Now let the super draw everything else, including our menu
                _super.prototype.render.call(this);
            };
            /**
             * Triggers on a key press
             *
             * @param eventObj key event object
             * @returns {boolean} true if we handled the key or false otherwise.
             */
            TitleScreen.prototype.inputKeyDown = function (eventObj) {
                // If the super handles the key, we're done.
                if (_super.prototype.inputKeyDown.call(this, eventObj))
                    return true;
                switch (eventObj.keyCode) {
                    // The M key mutes/un-mutes the music. Since the stage will toggle the mute state of
                    // everything, all we need to do here is give it the opposite of the current state of our
                    // music, and then our music and all other music will toggle state appropriately. Magic!
                    case game.KeyCodes.KEY_M:
                        this._stage.muteMusic(!this._music.muted);
                        return true;
                    // Previous menu selection (wraps around)
                    case game.KeyCodes.KEY_UP:
                        this._menu.selectPrevious();
                        return true;
                    // Next menu selection (wraps around)
                    case game.KeyCodes.KEY_DOWN:
                        this._menu.selectNext();
                        return true;
                    // Reduce the level (capped at 0 minimum)
                    case game.KeyCodes.KEY_LEFT:
                        if (this._menu.selected == 0) {
                            if (this._level > 0) {
                                this._level--;
                                this.updateMenu();
                            }
                            return true;
                        }
                        return false;
                    // Increase the level (capped at 20 maximum)
                    case game.KeyCodes.KEY_RIGHT:
                        if (this._menu.selected == 0) {
                            if (this._level < 20) {
                                this._level++;
                                this.updateMenu();
                            }
                            return true;
                        }
                        return false;
                    // Select the current menu item; on level increase it, on start game, do that.
                    case game.KeyCodes.KEY_ENTER:
                        if (this._menu.selected == 0) {
                            this._level++;
                            if (this._level > 20)
                                this._level = 0;
                            this.updateMenu();
                            return true;
                        }
                        else {
                            this._stage.switchToScene("game");
                            return true;
                        }
                        break;
                }
                // Not handled.
                return false;
            };
            return TitleScreen;
        })(game.Scene);
        game.TitleScreen = TitleScreen;
    })(game = nurdz.game || (nurdz.game = {}));
})(nurdz || (nurdz = {}));
var nurdz;
(function (nurdz) {
    var game;
    (function (game) {
        /**
         * The width of the pill bottle, in pills (tiles).
         *
         * @type {number}
         */
        var BOTTLE_WIDTH = 8;
        /**
         * The height of the pill bottle, in pills (tiles).
         *
         * @type {number}
         */
        var BOTTLE_HEIGHT = 16;
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
        var GENERATE_TICK = 0.5;
        /**
         * How many "units" wide the NUMBER_FONT font data points think that it is.
         *
         * @type {number}
         */
        var FONT_WIDTH = 3;
        /**
         * How many "units" tall the NUMBER_FONT font data points think that it is.
         * @type {number}
         */
        var FONT_HEIGHT = 5;
        /**
         * How many "units" should appear between consecutive NUMBER_FONT digits when they are rendered.
         *
         * @type {number}
         */
        var FONT_SPACING = 0.5;
        /**
         * This sets how big each unit in the font is when it is rendered. Thus each character in the font
         * will be FONT_WIDTH * FONT_SCALE pixels wide and FONT_HEIGHT * FONT_SCALE pixels tall. Set as
         * appropriate.
         *
         * @type {number}
         */
        var FONT_SCALE = game.TILE_SIZE / 3;
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
        var InputKey;
        (function (InputKey) {
            /**
             * Capsule movement keys.
             */
            InputKey[InputKey["LEFT"] = 0] = "LEFT";
            InputKey[InputKey["RIGHT"] = 1] = "RIGHT";
            InputKey[InputKey["DROP"] = 2] = "DROP";
            /**
             * Capsule rotation keys.
             */
            InputKey[InputKey["ROTATE_LEFT"] = 3] = "ROTATE_LEFT";
            InputKey[InputKey["ROTATE_RIGHT"] = 4] = "ROTATE_RIGHT";
            /**
             * Placeholder to tell us how big this array is.
             */
            InputKey[InputKey["KEY_COUNT"] = 5] = "KEY_COUNT";
        })(InputKey || (InputKey = {}));
        /**
         * The scene in which our game is played. This is responsible for drawing the bottle, the pills, and
         * handling the input and game logic.
         */
        var Game = (function (_super) {
            __extends(Game, _super);
            /**
             * Construct a new game scene.
             *
             * @param stage the stage that manages this scene
             * @constructor
             */
            function Game(stage) {
                // Invoke the super to set up our instance.
                _super.call(this, "game", stage);
                // Preload all of our resources.
                this._music = stage.preloadMusic("Pixelland");
                this._sndCapSlide = stage.preloadSound("capsule_slide");
                this._sndCapRotate = stage.preloadSound("capsule_rotate");
                this._sndCapDrop = stage.preloadSound("capsule_drop");
                this._sndMatchVirus = stage.preloadSound("match_virus");
                this._sndMatchEmpty = stage.preloadSound("match_segment");
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
                    new game.Segment(stage, game.SegmentType.EMPTY, game.SegmentColor.BLUE),
                    new game.Segment(stage, game.SegmentType.VIRUS, game.SegmentColor.BLUE),
                    new game.Segment(stage, game.SegmentType.SINGLE, game.SegmentColor.BLUE),
                    new game.Segment(stage, game.SegmentType.LEFT, game.SegmentColor.BLUE),
                    new game.Segment(stage, game.SegmentType.RIGHT, game.SegmentColor.BLUE),
                    new game.Segment(stage, game.SegmentType.TOP, game.SegmentColor.BLUE),
                    new game.Segment(stage, game.SegmentType.BOTTOM, game.SegmentColor.BLUE),
                ];
                // Iterate the list of segments and set them to nice positions and also make them invisible.
                for (var i = 0, x = game.TILE_SIZE / 2; i < this._segments.length; i++, x += game.TILE_SIZE) {
                    this._segments[i].setStagePositionXY(x, game.TILE_SIZE * 5);
                    this._segments[i].properties.visible = false;
                }
                // Make the empty segment debug so that it renders visibly, and make the virus always use the
                // same polygon to start with.
                this._segments[game.SegmentType.EMPTY].properties.debug = true;
                this._segments[game.SegmentType.VIRUS].virusPolygon = 2;
                // Create our pointer pointing to the selected segment in the segment list. We also want it to
                // be invisible by default
                this._pointer = new game.Pointer(stage, this._segments[this._segmentIndex].position.x, this._segments[this._segmentIndex].position.y - game.TILE_SIZE, 90);
                this._pointer.properties.visible = false;
                // Create the bottle that will hold te game board and its contents.
                this._bottle = new game.Bottle(stage, this, '#cccccc');
                // Create the capsule that the player controls and set its position to be at the column where
                // the opening of the bottle is, one row up from the top of the content area, so that it
                // appears to be inside the bottle opening.
                this._capsule = new game.Capsule(stage, this._bottle, game.Utils.randomIntInRange(0, 8));
                this._capsule.setMapPositionXY(this._bottle.openingXPosition, -1);
                // The level number text appears to the right of the bottle. We adjust down 1/2 a tile because
                // that aligns it with the top edge of the bottle, which is 1/2 a tile thick.
                this._levelTextPos = this._bottle.position.copyTranslatedXY(this._bottle.width, game.TILE_SIZE / 2);
                // Calculate the size of the largest number of viruses that can appear (the number is not as
                // important as the number of digits).
                var textSize = this.numberStringSize("99");
                // The virus text position appears to the bottom left of the bottle, adjusted up 1/2 a tile
                // because that aligns it with the bottom edge of the bottle, which is 1/2 a tile thick.
                this._virusTextPos = this._bottle.position.copyTranslatedXY(-textSize.x, this._bottle.height - textSize.y -
                    (game.TILE_SIZE / 2));
                // Now calculate the size of the largest score that can appear.
                textSize = this.numberStringSize("999999");
                // The score position appears to the top left of the bottle, adjusted down 1/2 a tile because
                // that aligns it with the top edge of the bottom, which is 1/2 a tile thick.
                this._scoreTextPos = this._bottle.position.copyTranslatedXY(-textSize.x, (game.TILE_SIZE / 2));
                // Create the capsule that shows us what the upcoming capsule is going to be, and place it
                // below the level text. It starts off hidden
                this._nextCapsule = new game.Capsule(stage, this._bottle, game.Utils.randomIntInRange(0, 8));
                this._nextCapsule.properties.visible = false;
                this._nextCapsule.setStagePosition(this._levelTextPos.copy());
                this._nextCapsule.position.translateXY(0, (FONT_HEIGHT * FONT_SCALE) + game.TILE_SIZE);
                // Set up the key state. We assume that all keys are not pressed at startup.
                this._keys = [];
                for (var i = 0; i < InputKey.KEY_COUNT; i++)
                    this._keys[i] = false;
                // Now add all of our entities to ourselves. This will cause them to get updated and drawn
                // automagically.
                this.addActorArray(this._segments);
                this.addActor(this._pointer);
                this.addActor(this._bottle);
                this.addActor(this._capsule);
                this.addActor(this._nextCapsule);
            }
            /**
             * Given a string of digits, return back a point where the X value indicates how many pixels wide
             * and tall the rendered polygon for that text would be.
             *
             * @param numberStr the string to calculate the size of
             * @returns {Point} a point whose x value is the width of the string in pixels and whose y is the
             * height in pixels.
             */
            Game.prototype.numberStringSize = function (numberStr) {
                // Get the height and width of a digit in our number font in pixels based on the scale factor.
                var pixelWidth = FONT_WIDTH * FONT_SCALE;
                var pixelHeight = FONT_HEIGHT * FONT_SCALE;
                var pixelGap = FONT_SPACING * FONT_SCALE;
                return new game.Point(numberStr.length * pixelWidth + (numberStr.length - 1) * pixelGap, pixelHeight);
            };
            Object.defineProperty(Game.prototype, "level", {
                /**
                 * Get the level that the game is currently at. In this scene, this represents the actual level
                 * that is being played right now.
                 */
                get: function () { return this._level; },
                enumerable: true,
                configurable: true
            });
            /**
             * Triggers when we become the active scene.
             *
             * @param previousScene the scene that used to be active
             */
            Game.prototype.activating = function (previousScene) {
                // Let the super do things so we get debug messages
                _super.prototype.activating.call(this, previousScene);
                // Start our music playing.
                this._music.play();
                // If the previous scene has a level property, it's the title screen. In that case, we want to
                // set our level to be what its level is prior to restarting.
                var newLevel = previousScene["level"];
                if (newLevel != undefined)
                    this._level = newLevel;
                // Restart the game; we're either restarting after a game over or coming in from the title screen.
                this.restartGame();
            };
            /**
             * Triggers when we are no longer the active scene.
             *
             * @param nextScene the scene that is going to become active.
             */
            Game.prototype.deactivating = function (nextScene) {
                // Let the super do things so we get debug messages.
                _super.prototype.deactivating.call(this, nextScene);
                // Pause our music playback.
                this._music.pause();
            };
            /**
             * Render our scene.
             *
             * Currently this method DOES NOT chain to the superclass, so it doesn't render any actors/entities.
             */
            Game.prototype.render = function () {
                // Clear the canvas, then let the super render everything for us.
                this._renderer.clear('black');
                _super.prototype.render.call(this);
                // If the game is not over, render the number of viruses in the bottle.
                if (this._gameOver == false)
                    this.renderNumber(this._virusTextPos.x, this._virusTextPos.y, 'white', this._bottle.virusCount + "");
                // Draw the current level; this always happens so you know what level you bailed at.
                this.renderNumber(this._levelTextPos.x, this._levelTextPos.y, 'white', this._level + "");
                // Draw the score. This also always happens.
                this.renderNumber(this._scoreTextPos.x, this._scoreTextPos.y, 'white', this._score + "");
            };
            /**
             * Crudely render a number using our number font.
             *
             * @param x the x position to render the top left of the number at
             * @param y the y position to render the top left of the number at
             * @param color the color to render the number
             * @param numString the string to render, which needs to be only digits.
             */
            Game.prototype.renderNumber = function (x, y, color, numString) {
                for (var i = 0; i < numString.length; i++, x += (FONT_WIDTH * FONT_SCALE) + (FONT_SPACING * FONT_SCALE)) {
                    // Translate to where the number should start rendering, then scale the canvas. Since the font
                    // data assumes 1 pixels per unit, the scale sets how many pixels wide each unit turns out.
                    this._renderer.translateAndRotate(x, y);
                    this._renderer.context.scale(FONT_SCALE, FONT_SCALE);
                    var polygon = NUMBER_FONT[numString[i]];
                    if (polygon)
                        this._renderer.fillPolygon(polygon, color);
                    this._renderer.restore();
                }
            };
            /**
             * Perform a frame update for our scene.
             * @param tick the game tick; this is a count of how many times the game loop has executed
             */
            Game.prototype.update = function (tick) {
                // Let the super update our child entities
                _super.prototype.update.call(this, tick);
                // Perform a virus generation step if it's been long enough to perform at least one.
                if (this._generatingLevel && tick >= this._genTicks + GENERATE_TICK) {
                    // Keep inserting viruses until we have inserted enough for this frame.
                    while (tick >= this._genTicks) {
                        this.virusGenerationStep();
                        this._genTicks += GENERATE_TICK;
                    }
                }
                // If we're allowed, see what the user wants to do with the capsule. We want to constrain
                // movements to not happen too often.
                if (this._controllingCapsule) {
                    // First, let te player try to manipulate the capsule. If we're about to drop the capsule,
                    // this is their "last chance" to do something.
                    //
                    // This is important because the drop key will drop the capsule all the way and then rely
                    // on the code below to handle it.
                    this.controlCapsule();
                    // If enough time has passed, attempt to drop the capsule.
                    if (tick >= this._lastDropTick + this._currentDropSpeed || this._forceDrop) {
                        // Make sure the force drop flag is no longer set.
                        this._forceDrop = false;
                        // Count this tick as the tick that the drop happened at.
                        this._lastDropTick = tick;
                        // Try to drop the capsule. If this doesn't work, we can't move down any more from where
                        // we are.
                        if (this._capsule.drop() == false) {
                            // Play the drop sound.
                            this._sndCapDrop.play();
                            // If the capsule is currently still outside the bottle, then the bottle is all filled
                            // up, and so the game is now over.
                            if (this._capsule.mapPosition.y < 0) {
                                this.gameOver();
                                return;
                            }
                            // Just a normal capsule drop; make the capsule invisible and stop the user from being
                            // able to control it.
                            this._capsule.properties.visible = false;
                            this._controllingCapsule = false;
                            // Now apply the capsule to the bottle contents and trigger the bottle to see if this
                            // formed a match or not.
                            this._capsule.apply();
                            this._bottle.trigger();
                        }
                    }
                }
            };
            /**
             * Check to see if the capsule is being moved by the player. If it is, and the move is allowed, go
             * ahead and do it.
             */
            Game.prototype.controlCapsule = function () {
                if (this._keys[InputKey.DROP]) {
                    this._keys[InputKey.DROP] = false;
                    // Tell the update loop to force a drop.
                    this._forceDrop = true;
                }
                else if (this._keys[InputKey.LEFT]) {
                    this._keys[InputKey.LEFT] = false;
                    if (this._capsule.slide(true))
                        this._sndCapSlide.play();
                }
                else if (this._keys[InputKey.RIGHT]) {
                    this._keys[InputKey.RIGHT] = false;
                    if (this._capsule.slide(false))
                        this._sndCapSlide.play();
                }
                else if (this._keys[InputKey.ROTATE_LEFT]) {
                    this._keys[InputKey.ROTATE_LEFT] = false;
                    if (this._capsule.rotate(true))
                        this._sndCapRotate.play();
                }
                else if (this._keys[InputKey.ROTATE_RIGHT]) {
                    this._keys[InputKey.ROTATE_RIGHT] = false;
                    if (this._capsule.rotate(false))
                        this._sndCapRotate.play();
                }
            };
            /**
             * Checks to see if the position provided is inside one of the displayed segments to the left of
             * the bottle; If so, change that segment to be the selected segment for inserting into the bottle.
             *
             * Additionally, if the click is on the virus but the virus is already the selected item, swap to
             * the next virus polygon for insertion.
             *
             * @param position the position to check
             */
            Game.prototype.checkSegmentSelectedAtStagePosition = function (position) {
                // Get the first and last segment in the segment display
                var first = this._segments[0];
                var last = this._segments[this._segments.length - 1];
                // Return if the point is out of bounds.
                if (position.x < first.position.x || position.y < first.position.y ||
                    position.x > last.position.x + last.width ||
                    position.y > last.position.y + last.height)
                    return;
                // The position is in a segment, so translate it to be relative to the position of the first
                // segment and then turn it into a tile coordinate so that we can use its X value to determine
                // what the selected index is.
                position = position.copyTranslatedXY(-first.position.x, -first.position.y).reduce(game.TILE_SIZE);
                // If the X is the same as the current selected index and the selected index is the virus,
                // bump its polygon.
                if (position.x == game.SegmentType.VIRUS && this._segmentIndex == game.SegmentType.VIRUS) {
                    var poly = this._segments[game.SegmentType.VIRUS].virusPolygon + 1;
                    if (poly == this._segments[game.SegmentType.VIRUS].virusPolygonCount)
                        poly = 0;
                    this._segments[game.SegmentType.VIRUS].virusPolygon = poly;
                }
                // Make the selected index match what the position X is. We also need to move the selection
                // pointer so that we know where to draw it.
                this._segmentIndex = position.x;
                this._pointer.position.x = this._segments[this._segmentIndex].position.x;
            };
            /**
             * This triggers when a mouse click event happens.
             *
             * @param eventObj the mouse click event
             */
            Game.prototype.inputMouseClick = function (eventObj) {
                // If the pointer is not visible, debug mode is not enabled, so clicks do nothing, so ignore
                // the event.
                if (this._pointer.properties.visible == false)
                    return false;
                // Get the position of the mouse on the stage where the click happened.
                var mousePosition = this._stage.calculateMousePos(eventObj);
                // Get the segment at the position where the mouse was clicked. It's null if the click didn't
                // happen inside the bottle contents area.
                var segment = this._bottle.segmentAtStagePosition(mousePosition);
                if (segment != null) {
                    // We got a segment. Copy the type, color and virus polygon from the currently selected
                    // segment.
                    var selected = this._segments[this._segmentIndex];
                    // Copy the type, color and polygon over.
                    segment.type = selected.type;
                    segment.color = selected.color;
                    segment.virusPolygon = selected.virusPolygon;
                    // Make the bottle recalculate its virus count.
                    this._bottle.debugRecountViruses();
                    return true;
                }
                // If we get here, the click is outside of the bottle. Check to see if the click is selecting
                // a segment for adding to the stage with the above code.
                this.checkSegmentSelectedAtStagePosition(mousePosition);
                // Yeah, we did a thing, even if we didn't find a segment.
                return true;
            };
            /**
             * Handle a key press or release event by marking the key array boolean as appropriate given the
             * event.
             *
             * @param keyCode the key code of the key that was pressed or released
             * @param pressed true if this was a key press event or false otherwise
             * @returns {boolean} true if keyCode was an input key that we cared about or false otherwise
             */
            Game.prototype.handleGameKey = function (keyCode, pressed) {
                // Store the state of the given key code and return true if this is one we care about.
                switch (keyCode) {
                    // These are the keys that control the actual game play.
                    case game.KeyCodes.KEY_LEFT:
                        this._keys[InputKey.LEFT] = pressed;
                        return true;
                    case game.KeyCodes.KEY_RIGHT:
                        this._keys[InputKey.RIGHT] = pressed;
                        return true;
                    case game.KeyCodes.KEY_DOWN:
                        this._keys[InputKey.DROP] = pressed;
                        return true;
                    case game.KeyCodes.KEY_Z:
                        this._keys[InputKey.ROTATE_LEFT] = pressed;
                        return true;
                    case game.KeyCodes.KEY_X:
                        this._keys[InputKey.ROTATE_RIGHT] = pressed;
                        return true;
                }
                // We care not.
                return false;
            };
            /**
             * Toggle debug state for the game. This makes various controls visible or not visible, which also
             * controls.
             */
            Game.prototype.toggleDebugState = function () {
                // Toggle the visibility of the pointer and all segments.
                this._pointer.properties.visible = !this._pointer.properties.visible;
                for (var i = 0; i < this._segments.length; i++)
                    this._segments[i].properties.visible = !this._segments[i].properties.visible;
                // If we are in debug mode, set the drop rate to an insane value to halt things; otherwise,
                // set it to the appropriate value.
                if (this._pointer.properties.visible)
                    this._currentDropSpeed = 99999;
                else
                    this._currentDropSpeed = this.dropSpeedForLevel(this._level);
            };
            /**
             * This triggers when a keyboard key is released.
             *
             * @param eventObj the event that represents the key released
             * @returns {boolean} true if the key was handled, false otherwise
             */
            Game.prototype.inputKeyUp = function (eventObj) {
                // We only need to handle game keys here.
                return this.handleGameKey(eventObj.keyCode, false);
            };
            /**
             * This triggers when a keyboard key is pressed.
             *
             * @param eventObj the event that represents the key pressed
             * @returns {boolean} true if the key was handled, false otherwise.
             */
            Game.prototype.inputKeyDown = function (eventObj) {
                // If the super handles the key, we're done.
                if (_super.prototype.inputKeyDown.call(this, eventObj))
                    return true;
                // If this is a key that is used to control the game, then this will handle it and return
                // true, in which case we're done./
                if (this.handleGameKey(eventObj.keyCode, true))
                    return true;
                // Check other keys
                switch (eventObj.keyCode) {
                    // The M key mutes/un-mutes the music. Since the stage will toggle the mute state of
                    // everything, all we need to do here is give it the opposite of the current state of our
                    // music, and then our music and all other music will toggle state appropriately. Magic!
                    case game.KeyCodes.KEY_M:
                        this._stage.muteMusic(!this._music.muted);
                        return true;
                    // F1 toggles debug mode on and off.
                    case game.KeyCodes.KEY_F1:
                        this.toggleDebugState();
                        return true;
                    // The C key cycles the segment color
                    case game.KeyCodes.KEY_C:
                        var color = this._segments[0].properties.color + 1;
                        if (color > 2)
                            color = 0;
                        for (var i = 0; i < this._segments.length; i++)
                            this._segments[i].color = color;
                        return true;
                }
                return false;
            };
            /**
             * Given a level number in the game (which starts at 0) return back the number of viruses that
             * should be inserted into the bottle for that level number. The number of viruses maxes out after
             * a certain point when the bottle gets too full.
             *
             * @param level the level to get the virus count for
             */
            Game.prototype.virusesForLevel = function (level) {
                // Constrain the level to our pre defined bounds.
                if (level < 0)
                    level = 0;
                if (level > 20)
                    level = 20;
                // There are 4 viruses per level, plus 4.
                return (level + 1) * 4;
            };
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
            Game.prototype.dropSpeedForLevel = function (level) {
                var baseSpeedList = [30, 30, 30, 25, 25,
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
            };
            /**
             * Start a new level at the given level number. This will empty out the bottle and then set the
             * flag that gets us started on virus generation for the new level.
             *
             * @param level the level to start.
             */
            Game.prototype.startNewLevel = function (level) {
                // Make sure the game is no longer over.
                this._gameOver = false;
                // Empty the bottle in preparation for the new level and hide the user controlled capsule and
                // the next capsule.
                this._bottle.emptyBottle();
                this._capsule.properties.visible = false;
                this._nextCapsule.properties.visible = false;
                this._controllingCapsule = false;
                // Set the level to generate and turn on our flag that says we are generating a new level.
                this._level = level;
                this._currentDropSpeed = this.dropSpeedForLevel(this._level);
                this._levelVirusCount = this.virusesForLevel(this._level);
                this._generatingLevel = true;
                this._genTicks = this._stage.tick;
            };
            /**
             * Restart the game by setting all state back to how it originally started, and then regenerate
             * the level we currently have set.
             */
            Game.prototype.restartGame = function () {
                // TODO Should this set up anything else?
                // Reset the score of the game, then start a new level.
                this._score = 0;
                this.startNewLevel(this._level);
            };
            /**
             * This gets invoked when the scene detects that the game is over; the user controlled capsule could
             * not drop down, but it was still outside the bottle, which means that everything is too blocked up
             * to continue.
             */
            Game.prototype.gameOver = function () {
                // Game is over now.
                this._gameOver = true;
                // Empty the bottle, hide the user capsule, and stop the user from controlling it.
                this._bottle.emptyBottle();
                this._capsule.properties.visible = false;
                this._nextCapsule.properties.visible = false;
                this._controllingCapsule = false;
                // Switch to the game over scene.
                this._stage.switchToScene("gameOver");
            };
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
            Game.prototype.textObjectForScore = function (score, position) {
                var textObj = null;
                // Scan over the list of text objects trying to find one that is not currently visible, so
                // that we can reuse it.
                for (var i = 0; i < this._textList.length; i++) {
                    if (this._textList[i].properties.visible == false) {
                        textObj = this._textList[i];
                        break;
                    }
                }
                // If we didn't find one, we need to create one.
                if (textObj == null) {
                    // Create it, then add it to the stage and to the array.
                    textObj = new game.FloatingText(this._stage, 0, 0, "");
                    this.addActor(textObj);
                    this._textList.push(textObj);
                }
                // Set the text and position of the object.
                textObj.text = score + "";
                textObj.position.setTo(position);
                // Now give it a life, a speed, and make it visible.
                textObj.properties.speed = game.Utils.randomIntInRange(1, 3);
                textObj.properties.life = game.Utils.randomIntInRange(25, 35);
                textObj.properties.visible = true;
                // Return it now.
                return textObj;
            };
            /**
             * The bottle invokes this whenever a match completes that removes the last of the viruses from
             * the bottle. This is our signal that it is time to start a new level.
             */
            Game.prototype.bottleEmpty = function () {
                this._level++;
                this.startNewLevel(this._level);
            };
            /**
             * The bottle invokes this whenever a match or drop completes but there are still viruses left in
             * the bottle.
             */
            Game.prototype.dropComplete = function () {
                // Set the user capsule back to the top of the bottle and make sure that it's horizontal.
                this._capsule.setMapPositionXY(this._bottle.openingXPosition, -1);
                this._capsule.properties.orientation = game.CapsuleOrientation.HORIZONTAL;
                // Copy the type from the next capsule to the current capsule, then regenerate the next capsule.
                this._capsule.properties.type = this._nextCapsule.properties.type;
                this._nextCapsule.properties.type = game.Utils.randomIntInRange(0, 8);
                // Make both capsules update their segments, so that they visually represent properly.
                this._capsule.updateSegments();
                this._nextCapsule.updateSegments();
                // Now we can make both capsules visible and let the user gain control again.
                this._capsule.properties.visible = true;
                this._nextCapsule.properties.visible = true;
                this._controllingCapsule = true;
                // Reset the last time the capsule naturally dropped to right this second, so that there is a
                // delay before the new one drops on its own.
                this._lastDropTick = this._stage.tick;
            };
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
            Game.prototype.matchMade = function (virusesRemoved, cascadeLength, matchPoint) {
                var PER_VIRUS_SCORE = 200;
                var CASCADE_MULTIPLIER_BONUS = [1, 2, 2.5, 3];
                // Play an appropriate sound for this match. This has to happen first since we're going to
                // fiddle the virus count below when we take score.
                if (virusesRemoved == 0)
                    this._sndMatchEmpty.play();
                else
                    this._sndMatchVirus.play();
                // Constrain the cascade length to the maximum allowable bonus.
                if (cascadeLength >= CASCADE_MULTIPLIER_BONUS.length)
                    cascadeLength = CASCADE_MULTIPLIER_BONUS.length - 1;
                // The score awarded for this match. There is a score awarded per virus clobbered in a single
                // match, but multiples are worth more. In particular, the first virus is worth PER_VIRUS_SCORE,
                // and the second one is worth twice that PLUS the value for the first one.
                var scoreThisMatch = 0;
                while (virusesRemoved > 0) {
                    scoreThisMatch += (virusesRemoved * PER_VIRUS_SCORE);
                    virusesRemoved--;
                }
                // Now, based on the cascade length, multiply the score for this match.
                scoreThisMatch *= CASCADE_MULTIPLIER_BONUS[cascadeLength];
                // If there was a score increase, update our score variable and then display how much this
                // match was for.
                if (scoreThisMatch > 0) {
                    this._score += scoreThisMatch;
                    this.textObjectForScore(scoreThisMatch, matchPoint);
                }
            };
            /**
             * This is called on a regular basis when a level is being generated to allow us to insert a new
             * virus into the bottle at the start of a level.
             *
             * This is responsible for turning off the generation flag when it's complete.
             */
            Game.prototype.virusGenerationStep = function () {
                // If the number of viruses in the bottle is the number that we want to generate, we're done.
                if (this._bottle.virusCount == this._levelVirusCount) {
                    // Turn off the flag and then show the user capsule, we're ready to play.
                    this._generatingLevel = false;
                    this.dropComplete();
                    return;
                }
                // Insert a virus into the bottle.
                this._bottle.insertVirus(this._level, this._levelVirusCount - this._bottle.virusCount);
            };
            return Game;
        })(game.Scene);
        game.Game = Game;
    })(game = nurdz.game || (nurdz.game = {}));
})(nurdz || (nurdz = {}));
var nurdz;
(function (nurdz) {
    var game;
    (function (game) {
        /**
         * The font that is used to display the main "Game Over" text.
         *
         * @type {string}
         */
        var MAIN_FONT = "32px Arial, Serif";
        /**
         * This class represents the game over screen. This is just a simple scene that jumps back to another
         * scene after telling you that the game is over.
         *
         * This may be overkill in this particular prototype, but this is a good example of one method of
         * de-cluttering the code by not having 100% of all visual logic in one place.
         */
        var GameOver = (function (_super) {
            __extends(GameOver, _super);
            /**
             * Construct a new scene, giving it a name and a controlling stage.
             *
             * @param stage the stage that controls us.
             */
            function GameOver(stage) {
                _super.call(this, "gameOver", stage);
                // Preload all of our resources.
                this._music = stage.preloadMusic("Mellowtron");
                // Set up our menu
                this._menu = new game.Menu(stage, "Arial,Serif", 20, stage.preloadSound("menu_select"));
                this._menu.addItem("Try again", new game.Point(325, 350));
                this._menu.addItem("Quit", new game.Point(325, 390));
                // Make sure it gets render and update requests.
                this.addActor(this._menu);
            }
            Object.defineProperty(GameOver.prototype, "level", {
                /**
                 * Get the level that the game is currently at. In this scene, this represents the level that the
                 * last game was at before it ended. This is queried by the title screen when we return to it so
                 * that it can set the level to be what the player ended at if they quit.
                 */
                get: function () {
                    // If we have a game scene and it has a level property, then return it.
                    if (this._gameScene && this._gameScene["level"] != undefined)
                        return this._gameScene["level"];
                    // Return 0 by default.
                    return 0;
                },
                enumerable: true,
                configurable: true
            });
            /**
             * This gets triggered when the stage changes from some other scene to our scene. We get told what
             * the previously active scene was. We use this to capture the game scene so that we can get it to
             * render itself.
             *
             * @param previousScene
             */
            GameOver.prototype.activating = function (previousScene) {
                // Chain to the super so we get debug messages (otherwise not needed) about the scene change
                _super.prototype.activating.call(this, previousScene);
                // Start our music playing.
                this._music.play();
                // Store the scene that preceeded us
                this._gameScene = previousScene;
            };
            /**
             * Triggers when we are no longer the active scene.
             *
             * @param nextScene the scene that is going to become active.
             */
            GameOver.prototype.deactivating = function (nextScene) {
                // Let the super do things so we get debug messages.
                _super.prototype.deactivating.call(this, nextScene);
                // Pause our music playback.
                this._music.pause();
            };
            /**
             * Display some text centered horizontally and vertically around the point provided, using the
             * given font and color.
             *
             * @param x the x position of the center of the location to draw the text
             * @param y the y position of the center of the locaiton to draw the text
             * @param text the text to render
             * @param font the font to use to render the text
             * @param color the color to render with
             */
            GameOver.prototype.displayText = function (x, y, text, font, color) {
                // Put the origin at the text position.
                this._renderer.translateAndRotate(x, y);
                // Set the font and indicate that the text should be centered in both directions.
                this._renderer.context.font = font;
                this._renderer.context.textAlign = "center";
                this._renderer.context.textBaseline = "middle";
                // Draw the text and restore the context.
                this._renderer.drawTxt(text, 0, 0, color);
                this._renderer.restore();
            };
            /**
             * Called to render our scene. We piggyback render on the scene that came before us so that we can
             * display extra stuff on the stage without having to fully replicate everything that the other
             * scene was doing.
             */
            GameOver.prototype.render = function () {
                // If we know what the game scene is, then allow it to render first, setting up the stage for us.
                // As a fallback, clear the stage when we don't know how this works.
                if (this._gameScene != null)
                    this._gameScene.render();
                else
                    this._renderer.clear('black');
                // Display our game over and press a key to restart text.
                this.displayText(this._stage.width / 2, this._stage.height / 2, "Game Over", MAIN_FONT, 'white');
                // Get the menu to update
                _super.prototype.render.call(this);
            };
            /**
             * Invoked to handle a key press. We use this to tell the stage to switch to the game scene again
             * from our scene.
             *
             * @param eventObj the event that tells us what key was pressed.
             * @returns {boolean} always true
             */
            GameOver.prototype.inputKeyDown = function (eventObj) {
                // If the super handles the key, we're done.
                if (_super.prototype.inputKeyDown.call(this, eventObj))
                    return true;
                switch (eventObj.keyCode) {
                    // The M key mutes/un-mutes the music. Since the stage will toggle the mute state of
                    // everything, all we need to do here is give it the opposite of the current state of our
                    // music, and then our music and all other music will toggle state appropriately. Magic!
                    case game.KeyCodes.KEY_M:
                        this._stage.muteMusic(!this._music.muted);
                        return true;
                    // Previous menu item (wraps around)
                    case game.KeyCodes.KEY_UP:
                        this._menu.selectPrevious();
                        return true;
                    // Next menu item (wraps around)
                    case game.KeyCodes.KEY_DOWN:
                        this._menu.selectNext();
                        return true;
                    // Select menu item; switches to either the title screen or the game screen depending on
                    // the item selected.
                    case game.KeyCodes.KEY_ENTER:
                        this._stage.switchToScene(this._menu.selected == 0 ? "game" : "title");
                        return true;
                }
                return false;
            };
            return GameOver;
        })(game.Scene);
        game.GameOver = GameOver;
    })(game = nurdz.game || (nurdz.game = {}));
})(nurdz || (nurdz = {}));
var nurdz;
(function (nurdz) {
    var main;
    (function (main) {
        /**
         * Set up the button on the page to toggle the state of the game.
         *
         * @param stage the stage to control
         * @param buttonID the ID of the button to mark up to control the game state
         */
        function setupButton(stage, buttonID) {
            // True when the game is running, false when it is not. This state is toggled by the button. We
            // assume that the game is going to start running.
            var gameRunning = true;
            // Get the button.
            var button = document.getElementById(buttonID);
            if (button == null)
                throw new ReferenceError("No button found with ID '" + buttonID + "'");
            // Set up the button to toggle the stage.
            button.addEventListener("click", function () {
                // Try to toggle the game state. This will only throw an error if we try to put the game into
                // a state it is already in, which can only happen if the engine stops itself when we didn't
                // expect it.
                try {
                    if (gameRunning) {
                        stage.muteMusic(true);
                        stage.muteSounds(true);
                        stage.stop();
                    }
                    else {
                        stage.muteMusic(false);
                        stage.muteSounds(false);
                        stage.run();
                    }
                }
                // Log and then rethrow the error.
                catch (error) {
                    console.log("Exception generated while toggling game state");
                    throw error;
                }
                finally {
                    // No matter what, toggle the state.
                    gameRunning = !gameRunning;
                    button.innerHTML = gameRunning ? "Stop Game" : "Restart Game";
                }
            });
        }
        // Once the DOM is loaded, set things up.
        nurdz.contentLoaded(window, function () {
            try {
                // Set up the stage.
                var stage = new nurdz.game.Stage('gameContent');
                // Set up the default values used for creating a screen shot.
                nurdz.game.Stage.screenshotFilenameBase = "rx";
                nurdz.game.Stage.screenshotWindowTitle = "Rx Clone Screenshot";
                // Set up the button that will stop the game if something goes wrong.
                setupButton(stage, "controlBtn");
                // Register all of our scenes.
                stage.addScene("game", new nurdz.game.Game(stage));
                stage.addScene("gameOver", new nurdz.game.GameOver(stage));
                stage.addScene("title", new nurdz.game.TitleScreen(stage));
                // Switch to the initial scene, add a dot to display and then run the game.
                stage.switchToScene("title");
                stage.run();
            }
            catch (error) {
                console.log("Error starting the game");
                throw error;
            }
        });
    })(main = nurdz.main || (nurdz.main = {}));
})(nurdz || (nurdz = {}));
