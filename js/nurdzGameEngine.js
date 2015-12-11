// Only attempt to include this static method if it does not already exist. This of course means that if
// it DOES already exist, our code is going to be unhappy. However, I would rather make my own code
// unstable than someone else's in this situation because I (hopefully) understand what my own code does.
if (!String.format) {
    /**
     * Takes a format string and one or more other strings, and does a replacement, returning a copy of the
     * newly formatted string.
     *
     * The format string can contain sequences like {0} or {1} or {n}, where that text (including the braces)
     * will get replaced with the argument at that location.
     *
     * Example: String.format ("Hello, {0}", "Terence"); returns the string "Hello, Terence".
     *
     * Note that in TypeScript this sort of thing is already possible because TypeScript includes support for
     * EcmaScript 6 template strings, which it compiles down. However in some cases such strings are not
     * desirable from a readability standpoint, particularly when there are a lot of substitutions and/or the
     * expressions are lengthy.
     *
     * As such, this function is provided for use in such situations.
     *
     * @param formatString the template string to format
     * @param params the objects to use in the replacements
     * @returns {string} the formatted string
     */
    String.format = function (formatString) {
        var params = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            params[_i - 1] = arguments[_i];
        }
        return formatString.replace(/{(\d+)}/g, function (match, number) {
            return typeof params[number] != 'undefined'
                ? params[number]
                : match;
        });
    };
}
var nurdz;
(function (nurdz) {
    /**
     * In a browser non-specific way, watch to determine when the DOM is fully loaded and then invoke
     * the function that is provided.
     *
     * This code was written by Diego Perini (diego.perini at gmail.com) and was taken from the
     * following URL:
     *     http://javascript.nwbox.com/ContentLoaded/
     *
     * @param win reference to the browser window object
     * @param fn the function to invoke when the DOM is ready.
     */
    function contentLoaded(win, fn) {
        // The typecast below was added for TypeScript compatibility because HTMLElement doesn't include
        // the doScroll() method used below when the browser is IE.
        var done = false, top = true, doc = win.document, root = doc.documentElement, modern = doc.addEventListener, add = modern ? 'addEventListener' : 'attachEvent', rem = modern ? 'removeEventListener' : 'detachEvent', pre = modern ? '' : 'on', init = function (e) {
            if (e.type == 'readystatechange' && doc.readyState != 'complete')
                return;
            (e.type == 'load' ? win : doc)[rem](pre + e.type, init, false);
            if (!done && (done = true))
                fn.call(win, e.type || e);
        }, poll = function () {
            try {
                root.doScroll('left');
            }
            catch (e) {
                setTimeout(poll, 50);
                return;
            }
            init('poll');
        };
        if (doc.readyState == 'complete')
            fn.call(win, 'lazy');
        else {
            if (!modern && root.doScroll) {
                try {
                    top = !win.frameElement;
                }
                catch (e) { }
                if (top)
                    poll();
            }
            doc[add](pre + 'DOMContentLoaded', init, false);
            doc[add](pre + 'readystatechange', init, false);
            win[add](pre + 'load', init, false);
        }
    }
    nurdz.contentLoaded = contentLoaded;
})(nurdz || (nurdz = {}));
var nurdz;
(function (nurdz) {
    var game;
    (function (game) {
        /**
         * The aspects of the engine that deal with tiles instead of pixels assume that this is the size of
         * tiles (in pixels). Tiles are assumed to be square.
         *
         * @const
         * @type {number}
         */
        game.TILE_SIZE = 32;
        /**
         * The width of the game stage (canvas) in pixels.
         *
         * @const
         * @type {number}
         */
        game.STAGE_WIDTH = 800;
        /**
         * The height of the game stage (canvas) in pixels.
         *
         * @const
         * @type {number}
         */
        game.STAGE_HEIGHT = 600;
        /**
         * The width of the game stage (canvas), in tiles.
         *
         * @const
         * @type {Number}
         */
        game.STAGE_TILE_WIDTH = Math.floor(game.STAGE_WIDTH / game.TILE_SIZE);
        /**
         * The height of the game stage (canvas), in tiles.
         *
         * @const
         * @type {Number}
         */
        game.STAGE_TILE_HEIGHT = Math.floor(game.STAGE_HEIGHT / game.TILE_SIZE);
        /**
         * This enumeration contains key code constants for use in keyboard events. Not all useful keys are
         * implemented here just yet. Add as required.
         */
        (function (KeyCodes) {
            KeyCodes[KeyCodes["KEY_ENTER"] = 13] = "KEY_ENTER";
            KeyCodes[KeyCodes["KEY_SPACEBAR"] = 32] = "KEY_SPACEBAR";
            // Arrow keys
            KeyCodes[KeyCodes["KEY_LEFT"] = 37] = "KEY_LEFT";
            KeyCodes[KeyCodes["KEY_UP"] = 38] = "KEY_UP";
            KeyCodes[KeyCodes["KEY_RIGHT"] = 39] = "KEY_RIGHT";
            KeyCodes[KeyCodes["KEY_DOWN"] = 40] = "KEY_DOWN";
            // Alpha keys; these are all a single case because shift state is tracked separately.
            KeyCodes[KeyCodes["KEY_A"] = 65] = "KEY_A";
            KeyCodes[KeyCodes["KEY_B"] = 66] = "KEY_B";
            KeyCodes[KeyCodes["KEY_C"] = 67] = "KEY_C";
            KeyCodes[KeyCodes["KEY_D"] = 68] = "KEY_D";
            KeyCodes[KeyCodes["KEY_E"] = 69] = "KEY_E";
            KeyCodes[KeyCodes["KEY_F"] = 70] = "KEY_F";
            KeyCodes[KeyCodes["KEY_G"] = 71] = "KEY_G";
            KeyCodes[KeyCodes["KEY_H"] = 72] = "KEY_H";
            KeyCodes[KeyCodes["KEY_I"] = 73] = "KEY_I";
            KeyCodes[KeyCodes["KEY_J"] = 74] = "KEY_J";
            KeyCodes[KeyCodes["KEY_K"] = 75] = "KEY_K";
            KeyCodes[KeyCodes["KEY_L"] = 76] = "KEY_L";
            KeyCodes[KeyCodes["KEY_M"] = 77] = "KEY_M";
            KeyCodes[KeyCodes["KEY_N"] = 78] = "KEY_N";
            KeyCodes[KeyCodes["KEY_O"] = 79] = "KEY_O";
            KeyCodes[KeyCodes["KEY_P"] = 80] = "KEY_P";
            KeyCodes[KeyCodes["KEY_Q"] = 81] = "KEY_Q";
            KeyCodes[KeyCodes["KEY_R"] = 82] = "KEY_R";
            KeyCodes[KeyCodes["KEY_S"] = 83] = "KEY_S";
            KeyCodes[KeyCodes["KEY_T"] = 84] = "KEY_T";
            KeyCodes[KeyCodes["KEY_U"] = 85] = "KEY_U";
            KeyCodes[KeyCodes["KEY_V"] = 86] = "KEY_V";
            KeyCodes[KeyCodes["KEY_W"] = 87] = "KEY_W";
            KeyCodes[KeyCodes["KEY_X"] = 88] = "KEY_X";
            KeyCodes[KeyCodes["KEY_Y"] = 89] = "KEY_Y";
            KeyCodes[KeyCodes["KEY_Z"] = 90] = "KEY_Z";
            // Function keys
            KeyCodes[KeyCodes["KEY_F1"] = 112] = "KEY_F1";
            KeyCodes[KeyCodes["KEY_F2"] = 113] = "KEY_F2";
            KeyCodes[KeyCodes["KEY_F3"] = 114] = "KEY_F3";
            KeyCodes[KeyCodes["KEY_F4"] = 115] = "KEY_F4";
            KeyCodes[KeyCodes["KEY_F5"] = 116] = "KEY_F5";
            KeyCodes[KeyCodes["KEY_F6"] = 117] = "KEY_F6";
            KeyCodes[KeyCodes["KEY_F7"] = 118] = "KEY_F7";
            KeyCodes[KeyCodes["KEY_F8"] = 119] = "KEY_F8";
            KeyCodes[KeyCodes["KEY_F9"] = 120] = "KEY_F9";
            KeyCodes[KeyCodes["KEY_F10"] = 121] = "KEY_F10";
            KeyCodes[KeyCodes["KEY_F11"] = 122] = "KEY_F11";
            KeyCodes[KeyCodes["KEY_F12"] = 123] = "KEY_F12";
        })(game.KeyCodes || (game.KeyCodes = {}));
        var KeyCodes = game.KeyCodes;
    })(game = nurdz.game || (nurdz.game = {}));
})(nurdz || (nurdz = {}));
/**
 * This module exports various helper routines that might be handy in a game context but which don't
 * otherwise fit into a class.
 */
var nurdz;
(function (nurdz) {
    var game;
    (function (game) {
        var Utils;
        (function (Utils) {
            /**
             * Return a random floating point number in the range of min to max, inclusive.
             *
             * @param min the minimum number to return, inclusive
             * @param max the maximum number to return, inclusive
             *
             * @returns {number} a random number somewhere in the range of min and max, inclusive
             */
            function randomFloatInRange(min, max) {
                return Math.random() * (max - min) + min;
            }
            Utils.randomFloatInRange = randomFloatInRange;
            /**
             * Return a random integer number in the range of min to max, inclusive.
             *
             * @param min the minimum number to return, inclusive
             * @param max the maximum number to return, inclusive
             *
             * @returns {number} a random number somewhere in the range of min and max, inclusive
             */
            function randomIntInRange(min, max) {
                return Math.floor(Math.random() * (max - min + 1)) + min;
            }
            Utils.randomIntInRange = randomIntInRange;
            /**
             * Convert an angle in degrees to an angle in radians. Internally, the JavaScript math API assumes
             * radians, but in games we may want to use degrees as a simplification.
             *
             * @param degrees an angle in degrees to convert
             * @returns {number} the number of degrees, converted into radians.
             */
            function toRadians(degrees) {
                return degrees * Math.PI / 180;
            }
            Utils.toRadians = toRadians;
            /**
             * Convert an angle in radians to an angle in degrees. Internally, the JavaScript math API assumes
             * radians, but in games we may want to use degrees as a simplification.
             *
             * @param radians an angle in radians to convert
             * @returns {number} the number of radians, converted into degrees.
             */
            function toDegrees(radians) {
                return radians * 180 / Math.PI;
            }
            Utils.toDegrees = toDegrees;
            /**
             * Given some angle in degrees, normalize it so that it falls within the range of 0 <-> 359 degrees,
             * inclusive (i.e. 360 degrees becomes 0 and -1 degrees becomes 359, etc).
             *
             * @param degrees the angle in degrees to normalize
             * @returns {number} the normalized angle; it is always in the range of 0 to 359 degrees, inclusive
             */
            function normalizeDegrees(degrees) {
                degrees %= 360;
                if (degrees < 0)
                    degrees += 360;
                return degrees % 360;
            }
            Utils.normalizeDegrees = normalizeDegrees;
        })(Utils = game.Utils || (game.Utils = {}));
    })(game = nurdz.game || (nurdz.game = {}));
})(nurdz || (nurdz = {}));
var nurdz;
(function (nurdz) {
    var game;
    (function (game) {
        /**
         * This class represents a single point as a pair of X,Y coordinates. This also includes simple operations
         * such as setting and clamping of values, as well as making copies and comparisons.
         *
         * Most API functions provided come in a variety that takes an X,Y and one that takes another point,
         * so that calling code can use whatever it most appropriate for the situation without having to box
         * or un-box values.
         */
        var Point = (function () {
            /**
             * Construct a new point that uses the provided X and Y values as its initial coordinate.
             *
             * @param x X-coordinate of this point
             * @param y Y-coordinate of this point
             * @constructor
             */
            function Point(x, y) {
                this._x = x;
                this._y = y;
            }
            Object.defineProperty(Point.prototype, "x", {
                /**
                 * X-coordinate of this point.
                 *
                 * @returns {number}
                 */
                get: function () { return this._x; },
                /**
                 * Set the x-coordinate of this point
                 *
                 * @param newX the new X to set.
                 */
                set: function (newX) { this._x = newX; },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Point.prototype, "y", {
                /**
                 * Y-coordinate of this point.
                 *
                 * @returns {number}
                 */
                get: function () { return this._y; },
                /**
                 * Set the y-coordinate of this point
                 *
                 * @param newY the new y to set.
                 */
                set: function (newY) { this._y = newY; },
                enumerable: true,
                configurable: true
            });
            /**
             * Return a new point instance that is a copy of this point.
             *
             * @returns {Point} a duplicate of this point
             * @see Point.copyTranslatedXY
             */
            Point.prototype.copy = function () {
                return new Point(this._x, this._y);
            };
            /**
             * Return a new point instance that is a copy of this point, with its values translated by the values
             * passed in.
             *
             * @param translation the point to translate this point by
             * @returns {Point} a duplicate of this point, translated by the value passed in
             * @see Point.copy
             * @see Point.copyTranslatedXY
             */
            Point.prototype.copyTranslated = function (translation) {
                return this.copyTranslatedXY(translation._x, translation._y);
            };
            /**
             * Return a new point instance that is a copy of this point, with its values translated by the values
             * passed in.
             *
             * @param x the amount to translate the X value by
             * @param y the amount to translate the Y value by
             * @returns {Point} a duplicate of this point, translated by the value passed in
             * @see Point.copy
             * @see Point.copyTranslated
             */
            Point.prototype.copyTranslatedXY = function (x, y) {
                var retVal = this.copy();
                return retVal.translateXY(x, y);
            };
            /**
             * Create and return a copy of this point in which each component is divided by the factor provided.
             * This allows for some simple coordinate conversions in a single step. After conversion the points
             * are rounded down to ensure that the coordinates remain integers.
             *
             * This is a special case of scale() that is more straight forward for use in some cases.
             *
             * @param factor the amount to divide each component of this point by
             * @returns {Point} a copy of this point with its values divided by the passed in factor
             * @see Point.scale
             * @see Point.copyScaled
             */
            Point.prototype.copyReduced = function (factor) {
                return this.copy().reduce(factor);
            };
            /**
             * Create and return a copy of this point in which each component is scaled by the scale factor
             * provided. This allows for some simple coordinate conversions in a single step. After conversion the
             * points are rounded down to ensure that the coordinates remain integers.
             *
             * @param {Number} scale the amount to multiply each component of this point by
             * @returns {Point} a copy of this point with its values scaled by the passed in factor
             * @see Point.reduce
             * @see Point.copyReduced
             */
            Point.prototype.copyScaled = function (scale) {
                return this.copy().scale(scale);
            };
            /**
             * Set the position of this point to the same as the point passed in.
             *
             * @param point the point to copy from
             * @returns {Point} this point after the operation completes, for chaining calls.
             */
            Point.prototype.setTo = function (point) {
                return this.setToXY(point._x, point._y);
            };
            /**
             * Set the position of this point to the same as the values passed in
             *
             * @param x new X-coordinate for this point
             * @param y new Y-coordinate for this point
             * @returns {Point} this point after the operation completes, for chaining calls.
             */
            Point.prototype.setToXY = function (x, y) {
                this._x = x;
                this._y = y;
                return this;
            };
            /**
             * Set the position of this point to the first two values in the array passed in, where the first
             * value is treated as the X value and the second value is treated as the Y value.
             *
             * It is valid for the array to have more than two elements, but if it has fewer than two, nothing
             * happens.
             *
             * @param array the array to get the new values from.
             * @returns {Point} this point after the operation completes, for chaining calls.
             */
            Point.prototype.setToArray = function (array) {
                if (array.length >= 2) {
                    this._x = array[0];
                    this._y = array[1];
                    return this;
                }
            };
            /**
             * Compares this point to the point passed in to determine if they represent the same point.
             *
             * @param other the point to compare to
             * @returns {boolean} true or false depending on equality
             */
            Point.prototype.equals = function (other) {
                return this._x == other._x && this._y == other._y;
            };
            /**
             * Compares this point to the values passed in to determine if they represent the same point.
             *
             * @param x the X-coordinate to compare to
             * @param y the Y-coordinate to compare to
             * @returns {boolean} true or false depending on equality
             */
            Point.prototype.equalsXY = function (x, y) {
                return this._x == x && this._y == y;
            };
            /**
             * Translate the location of this point using the values of the point passed in. No range checking is
             * done.
             *
             * @param delta the point that controls both delta values
             * @returns {Point} this point after the translation, for chaining calls.
             */
            Point.prototype.translate = function (delta) {
                return this.translateXY(delta._x, delta._y);
            };
            /**
             * Translate the location of this point using the values passed in. No range checking is done.
             *
             * @param deltaX the change in X-coordinate
             * @param deltaY the change in Y-coordinate
             * @returns {Point} this point after the translation, for chaining calls.
             */
            Point.prototype.translateXY = function (deltaX, deltaY) {
                this._x += deltaX;
                this._y += deltaY;
                return this;
            };
            /**
             * Calculate and return the value of the point that is some distance away from this point at the angle
             * provided.
             *
             * This works by using trig and assuming that the point desired is the point that describes the
             * hypotenuse of a right triangle.
             *
             * @param angle the angle desired, in degrees
             * @param distance the desired distance from this point
             * @returns {Point} the resulting point
             */
            Point.prototype.pointAtAngle = function (angle, distance) {
                // Convert the incoming angle to radians.
                angle *= (Math.PI / 180);
                // We treat this like a right angle triangle problem.
                //
                // Since we know that the cosine is the ratio between the lengths of the adjacent and hypotenuse
                // and the sine is the ratio between the opposite and the hypotenuse, we can calculate those
                // values for the angle we were given, realizing that the adjacent side is the X component and
                // the opposite is the Y component (draw it on paper if you need to).  By multiplying each value
                // with the distance required (the provided distance is the length of the hypotenuse in the
                // triangle), we determine what the actual X and Y values for the point is.  Note that these
                // calculations assume that the origin is the point from which the hypotenuse extends, and so we
                // need to translate the calculated values by the position of that point to get the final
                // location of where the end of the line falls.
                return new Point(Math.cos(angle), Math.sin(angle)).scale(distance).translate(this);
            };
            /**
             * Reduce the components in this point by dividing each by the factor provided. This allows for some
             * simple coordinate conversions in a single step. After conversion the points are rounded down to
             * ensure that the coordinates remain integers.
             *
             * This is a special case of scale() that is more straight forward for use in some cases.
             *
             * @param factor the amount to divide each component of this point by
             * @returns {Point} a copy of this point with its values divided by the passed in factor
             * @see Point.scale
             * @see Point.copyScaled
             */
            Point.prototype.reduce = function (factor) {
                this._x = Math.floor(this._x / factor);
                this._y = Math.floor(this._y / factor);
                return this;
            };
            /**
             * Scale the components in this point by multiplying each by the scale factor provided. This allows
             * for some simple coordinate conversions in a single step. After conversion the points are rounded
             * down to ensure that the coordinates remain integers.
             *
             * @param scale the amount to multiply each component of this point by
             * @returns {Point} this point after the scale, for chaining calls.
             * @see Point.reduce
             * @see Point.copyReduced
             */
            Point.prototype.scale = function (scale) {
                this._x = Math.floor(this._x * scale);
                this._y = Math.floor(this._y * scale);
                return this;
            };
            /**
             * Clamp the value of the X-coordinate of this point so that it is between the min and max values
             * provided, inclusive.
             *
             * @param minX the minimum X-coordinate to allow
             * @param maxX the maximum Y-coordinate to allow
             * @returns {Point} this point after the clamp is completed, for chaining calls.
             */
            Point.prototype.clampX = function (minX, maxX) {
                if (this._x < minX)
                    this._x = minX;
                else if (this._x > maxX)
                    this._x = maxX;
                return this;
            };
            /**
             * Clamp the value of the Y-coordinate of this point so that it is between the min and max values
             * provided, inclusive.
             *
             * @param minY the minimum Y-coordinate to allow
             * @param maxY the maximum Y-coordinate to allow
             * @returns {Point} this point after the clamp is completed, for chaining calls.
             */
            Point.prototype.clampY = function (minY, maxY) {
                if (this._y < minY)
                    this._y = minY;
                else if (this._y > maxY)
                    this._y = maxY;
                return this;
            };
            /**
             * Clamp the X and Y values of the provided point so that they are within the bounds of the stage
             * provided.
             *
             * @param stage the stage to clamp to
             * @returns {Point} this point after the clamp is completed, for chaining calls.
             */
            Point.prototype.clampToStage = function (stage) {
                this.clampX(0, stage.width - 1);
                this.clampY(0, stage.height - 1);
                return this;
            };
            /**
             * Return a copy of this point as an array of two numbers in x, y ordering.
             *
             * @returns {Array<number>} the point as an array of two numbers.
             */
            Point.prototype.toArray = function () {
                return [this._x, this._y];
            };
            /**
             * Return a string representation of the object, for debugging purposes.
             *
             * @returns {String} a debug string representation
             */
            Point.prototype.toString = function () {
                return String.format("[{0}, {1}]", this._x, this._y);
            };
            return Point;
        })();
        game.Point = Point;
    })(game = nurdz.game || (nurdz.game = {}));
})(nurdz || (nurdz = {}));
var nurdz;
(function (nurdz) {
    var game;
    (function (game) {
        /**
         * This class represents the base class for any game object of any base type. This base class
         * implementation has a position and knows how to render itself.
         *
         */
        var Actor = (function () {
            /**
             *
             * @param name the internal name for this actor instance, for debugging
             * @param stage the stage that will be used to display this actor
             * @param x X co-ordinate of the location for this actor, in world coordinates
             * @param y Y co-ordinate of the location for this actor, in world coordinates
             * @param width the width of this actor, in pixels
             * @param height the height of this actor, in pixels
             * @param zOrder the Z-order of this actor when rendered (smaller numbers render before larger ones)
             * @param debugColor the color specification to use in debug rendering for this actor
             * @constructor
             */
            function Actor(name, stage, x, y, width, height, zOrder, debugColor) {
                if (zOrder === void 0) { zOrder = 1; }
                if (debugColor === void 0) { debugColor = 'white'; }
                // Save the passed in values.
                this._name = name;
                this._stage = stage;
                this._width = width;
                this._height = height;
                this._zOrder = zOrder;
                this._debugColor = debugColor;
                // For position we save the passed in position and then make a reduced copy to turn it into
                // tile coordinates for the map position.
                this._position = new game.Point(x, y);
                this._mapPosition = this._position.copyReduced(game.TILE_SIZE);
            }
            Object.defineProperty(Actor.prototype, "mapPosition", {
                /**
                 * The position of this actor in the tile map. These coordinates are in tiles.
                 *
                 * @returns {Point}
                 */
                get: function () { return this._mapPosition; },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Actor.prototype, "position", {
                /**
                 * The position of this actor in the world. These coordinates are in pixel coordinates.
                 *
                 * @returns {Point}
                 */
                get: function () { return this._position; },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Actor.prototype, "zOrder", {
                /**
                 * Get the layer (Z-Order) of this actor. When rendered, actors with a lower Z-Order are rendered
                 * before actors with a higher Z-Order; thus this sets the rendering and display order for actors
                 * by type.
                 *
                 * @returns {number}
                 */
                get: function () { return this._zOrder; },
                /**
                 * Set the layer (Z-Order) of this actor. When rendered, actors with a lower Z-Order are rendered
                 * before actors with a higher Z-Order; thus this sets the rendering and display order for actors
                 * by type.
                 *
                 * @returns {number}
                 */
                set: function (newZOrder) { this._zOrder = newZOrder; },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Actor.prototype, "stage", {
                /**
                 * Get the stage that owns this actor.
                 *
                 * @returns {Stage}
                 */
                get: function () { return this._stage; },
                enumerable: true,
                configurable: true
            });
            /**
             * Update internal stage for this actor. The default implementation does nothing.
             *
             * @param stage the stage that the actor is on
             */
            Actor.prototype.update = function (stage) {
            };
            /**
             * Render this actor to the stage provided. The default implementation renders a positioning box
             * for this actor using its position and size using the debug color set at construction time.
             *
             * @param x the x location to render the actor at, in stage coordinates (NOT world)
             * @param y the y location to render the actor at, in stage coordinates (NOT world)
             * @param renderer the class to use to render the actor
             */
            Actor.prototype.render = function (x, y, renderer) {
                // Draw a filled rectangle for actor using the debug color.
                renderer.fillRect(x, y, this._width, this._height, this._debugColor);
            };
            /**
             * Set the position of this actor by setting its position on the stage in world coordinates. The
             * position of the actor on the map will automatically be updated as well.
             *
             * @param point the new position for this actor
             */
            Actor.prototype.setStagePosition = function (point) {
                this.setStagePositionXY(point.x, point.y);
            };
            /**
             /**
             * Set the position of this actor by setting its position on the stage in world coordinates. The
             * position of the actor on the map will automatically be updated as well.
             *
             * @param x the new X coordinate for the actor
             * @param y the new Y coordinate for the actor
             */
            Actor.prototype.setStagePositionXY = function (x, y) {
                this._position.setToXY(x, y);
                this._mapPosition = this._position.copyReduced(game.TILE_SIZE);
            };
            /**
             * Set the position of this actor by setting its position on the map in ile coordinates. The
             * position of the actor in the world will automatically be updated as well.
             *
             * @param point the new position for this actor
             */
            Actor.prototype.setMapPosition = function (point) {
                this.setMapPositionXY(point.x, point.y);
            };
            /**
             * Set the position of this actor by setting its position on the map in ile coordinates. The
             * position of the actor in the world will automatically be updated as well.
             *
             * @param x the new X coordinate for this actor
             * @param y the new Y coordinate for this actor
             */
            Actor.prototype.setMapPositionXY = function (x, y) {
                this._mapPosition.setToXY(x, y);
                this._position = this._mapPosition.copyScaled(game.TILE_SIZE);
            };
            /**
             * Return a string representation of the object, for debugging purposes.
             *
             * @returns {String} a debug string representation
             */
            Actor.prototype.toString = function () {
                return String.format("[Actor name={0}]", this._name);
            };
            return Actor;
        })();
        game.Actor = Actor;
    })(game = nurdz.game || (nurdz.game = {}));
})(nurdz || (nurdz = {}));
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
         * This class represents an Entity, which is a specific subclass of Actor that is designed to be
         * interactive with other actors and entities. An entity contains properties that can help define its
         * runtime behaviour.
         *
         * The properties provided may be extended with default values, depending on the subclass. Subclasses
         * can set this.defaultProperties to a set of properties that should be applied if they do not already
         * exist in the property set.
         *
         * Each subclass of Entity is responsible for making sure to blend the defaults with those of their
         * parent class so that the chained constructor calls set up the properties as appropriate.
         *
         * By default, entities support the following properties:
         *   - 'id': string (default: auto generated value)
         *      - specifies the id of this entity for use in identifying/finding/triggering this entity.
         */
        var Entity = (function (_super) {
            __extends(Entity, _super);
            /**
             * Construct a new entity instance at a given location with given dimensions.
             *
             * All entities have properties that can control their activities at runtime, which are provided
             * in the constructor. In addition, a list of default properties may also be optionally provided.
             *
             * At construction time, any properties that appear in the default properties given that do not
             * already appear in the specific properties provided will be copied from the defaults provided.
             * This mechanism is meant to be used from a subclass as a way to have subclasses provide default
             * properties the way the Entity class itself does.
             *
             * Subclasses that require additional properties should create their own extended EntityProperties
             * interface to include the new properties, passing an instance to this constructor with a
             * typecast to its own type.
             *
             * @param name the internal name for this entity instance, for debugging
             * @param stage the stage that will be used to display this entity
             * @param x X co-ordinate of the location for this entity, in world coordinates
             * @param y Y co-ordinate of the location for this entity, in world coordinates
             * @param width the width of this entity, in pixels
             * @param height the height of this entity, in pixels
             * @param zOrder the Z-order of this entity when rendered (smaller numbers render before larger ones)
             * @param properties entity specific properties to apply to this entity
             * @param defaults default properties to apply to the instance for any required properties that do
             * not appear in the properties given
             * @param debugColor the color specification to use in debug rendering for this entity
             * @constructor
             */
            function Entity(name, stage, x, y, width, height, zOrder, properties, defaults, debugColor) {
                if (defaults === void 0) { defaults = {}; }
                if (debugColor === void 0) { debugColor = 'white'; }
                // Invoke the super class constructor.
                _super.call(this, name, stage, x, y, width, height, zOrder, debugColor);
                // Save our properties, apply defaults, and then validate them
                this._properties = properties;
                this.applyDefaultProperties(defaults);
                this.validateProperties();
            }
            Object.defineProperty(Entity.prototype, "properties", {
                /**
                 * The list of properties that is assigned to this entity.
                 *
                 * @returns {EntityProperties}
                 */
                get: function () { return this._properties; },
                enumerable: true,
                configurable: true
            });
            /**
             * This method is for use in modifying an entity property object to include defaults for properties
             * that don't already exist.
             *
             * In use, the list of defaults is walked, and for each such default that does not already have a
             * value in the properties object, the property will be copied over to the properties object.
             *
             * @param defaults default properties to apply to this entity
             */
            Entity.prototype.applyDefaultProperties = function (defaults) {
                for (var propertyName in defaults) {
                    if (defaults.hasOwnProperty(propertyName) && this._properties[propertyName] == null)
                        this._properties[propertyName] = defaults[propertyName];
                }
            };
            /**
             * Every time this method is invoked, it returns a new unique entity id string to apply to the id
             * property of an entity.
             *
             * @returns {string}
             */
            Entity.createDefaultID = function () {
                Entity.autoEntityID++;
                return "_ng_entity" + Entity.autoEntityID;
            };
            /**
             * This helper method is for validating entity properties. The method checks to see if a property
             * exists or not, if it is supposed to. It can also optionally confirm that the value is in some
             * range of valid values.
             *
             * The type is not checked because the TypeScript compiler already enforces that properties that
             * are known are of a valid type.
             *
             * Also note that some EntityProperty interface subclasses may specify that a property is not in
             * fact optional; when this is the case, this method is not needed except to validate values,
             * because the compiler is already validating that it's there.
             *
             * The "is required" checking here is intended for situations where properties are actually deemed
             * "always required" but which always have a default value that is forced in the Entity default
             * properties. In this case the interface would say that they're optional, but they're really not
             * and we just want to catch the developer forgetting to specify them.
             *
             * @param name the name of the property to validate.
             * @param required true when this property is required and false when it is optional
             * @param values either null or an array of contains all of the possible valid values for the
             * property. It's up to you to ensure that the type of the elements in the array matches the type
             * of the property being validated
             * @throws {Error} if the property is not valid for any reason
             */
            Entity.prototype.isPropertyValid = function (name, required, values) {
                if (values === void 0) { values = null; }
                // Get the value of the property (if any).
                var propertyValue = this._properties[name];
                // Does the property exist?
                if (propertyValue == null) {
                    // It does not. If it's not required, then return. Otherwise, complain that it's missing.
                    if (required)
                        throw new ReferenceError("Entity " + this._name + ": missing property '" + name + "'");
                    else
                        return;
                }
                // If we got a list of possible values and this property actually exists, make sure that the
                // value is one of them.
                if (values != null && propertyValue != null) {
                    for (var i = 0; i < values.length; i++) {
                        if (propertyValue == values[i])
                            return;
                    }
                    // If we get here, we did not find the value in the list of valid values.
                    throw new RangeError("Entity " + this._name + ": invalid value for property '" + name + "': not in allowable list");
                }
            };
            /**
             * This method is automatically invoked at construction time to validate that the properties object
             * provided is valid as far as we can tell (i.e. needed properties exist and have a sensible value).
             *
             * Do note that the TypeScript compiler will ensure that the types of any properties are correct,
             * so this is really only needed to vet values and also to ensure that optional properties that
             * are not really optional but only marked that way so that they can have defaults were actually
             * installed, as a protection to the developer.
             *
             * This does not need to check if the values are valid as far as the other entities are concerned
             * (i.e. does a property that expects an entity id actually represent a valid entity) as that
             * happens elsewhere; further, that entity might not be created yet.
             *
             * This should throw an error if any properties are invalid. Make sure you call the super method
             * in your subclass!
             *
             * @throw {Error} if any properties in this entity are invalid
             */
            Entity.prototype.validateProperties = function () {
                // If there is not an id property, install it. We don't have to otherwise validate anything,
                // as this is the only property that we care about and the compiler ensures that its type is
                // correct so we don't have to do anything else.
                if (this._properties.id == null)
                    this._properties.id = Entity.createDefaultID();
            };
            /**
             * Query whether this entity should block movement of the actor provided or not.
             *
             * By default, entities block all actor movement. Note that this means that there is no API contract
             * as far as the core engine code is concerned with regards to the actor value passed in being
             * non-null.
             *
             * @param actor the actor to check blocking for, or null if it doesn't matter
             * @returns {boolean}
             */
            Entity.prototype.blocksActorMovement = function (actor) {
                return true;
            };
            /**
             * This method is invoked whenever this entity gets triggered by another entity. This can happen
             * programmatically or in response to interactions with other entities, which does not include
             * collision (see triggerTouch() for that).
             *
             * The method gets passed the Actor that caused the trigger to happen, although this can be null
             * depending on how the trigger happened.
             *
             * @param activator the actor that triggered this entity, or null if unknown
             * @see Entity.triggerTouch
             */
            Entity.prototype.trigger = function (activator) {
                if (activator === void 0) { activator = null; }
            };
            /**
             * This method is invoked whenever this entity gets triggered by another entity as a result of a
             * direct collision (touch). This can happen programmatically or in response to interactions with
             * other entities. This does not include non-collision interactions (see trigger() for that).
             *
             * The method gets passed the Actor that caused the trigger to happen.
             *
             * @param activator the actor that triggered this entity by touching (colliding) with it
             * @see Entity.trigger
             */
            Entity.prototype.triggerTouch = function (activator) {
            };
            /**
             * Return a string representation of the object, for debugging purposes.
             *
             * @returns {String} a debug string representation
             */
            Entity.prototype.toString = function () {
                return String.format("[Entity name={0}]", this._name);
            };
            /**
             * Every time an entity ID is automatically generated, this value is appended to it to give it a
             * unique number.
             *
             * @type {number}
             */
            Entity.autoEntityID = 0;
            return Entity;
        })(game.Actor);
        game.Entity = Entity;
    })(game = nurdz.game || (nurdz.game = {}));
})(nurdz || (nurdz = {}));
var nurdz;
(function (nurdz) {
    var game;
    (function (game) {
        /**
         * This class is the base class for all scenes in a game. A Scene is just a simple wrapper around
         * specific handling for input handling as well as object update and rendering, which allows for better
         * object isolation.
         *
         * This base class defines the behaviour of a scene as it applies to a game; you should subclass it to
         * implement your own specific handling as needed.
         */
        var Scene = (function () {
            /**
             * Construct a new scene instances that has the given name and is managed by the provided stage.
             *
             * The new scene starts with an empty actor list.
             *
             * @param name the name of this scene for debug purposes
             * @param stage the stage that manages this scene
             * @constructor
             */
            function Scene(name, stage) {
                // Store the name and stage provided.
                this._name = name;
                this._stage = stage;
                this._renderer = stage.renderer;
                // Start with an empty actor list
                this._actorList = [];
            }
            /**
             * This method is invoked at the start of every game frame to allow this scene to update the state of
             * all objects that it contains.
             *
             * This base version invokes the update method for all actors that are currently registered with the
             * scene.
             */
            Scene.prototype.update = function () {
                for (var i = 0; i < this._actorList.length; i++)
                    this._actorList[i].update(this._stage);
            };
            /**
             * This method is invoked every frame after the update() method is invoked to allow this scene to
             * render to the stage everything that it visually wants to appear.
             *
             * This base version invokes the render method for all actors that are currently registered with the
             * stage.
             */
            Scene.prototype.render = function () {
                for (var i = 0; i < this._actorList.length; i++) {
                    var actor = this._actorList[i];
                    actor.render(actor.position.x, actor.position.y, this._renderer);
                }
            };
            /**
             * This method is invoked when this scene is becoming the active scene in the game. This can be used
             * to initialize (or re-initialize) anything in this scene that should be reset when it becomes
             * active.
             *
             * This gets invoked after the current scene is told that it is deactivating. The parameter passed in
             * is the scene that was previously active. This will be null if this is the first ever scene in the
             * game.
             *
             * The next call made of the scene will be its update method for the next frame.
             *
             * @param previousScene the previous scene, if any (the very first scene change in the game has no
             * previous scene)
             */
            Scene.prototype.activating = function (previousScene) {
                if (previousScene === void 0) { previousScene = null; }
                console.log("Scene activation:", this.toString());
            };
            /**
             * This method is invoked when this scene is being deactivated in favor of a different scene. This can
             * be used to persist any scene state or do any other house keeping.
             *
             * This gets invoked before the next scene gets told that it is becoming active. The parameter
             * passed in is the scene that will become active.
             *
             * @param nextScene the scene that is about to become active
             */
            Scene.prototype.deactivating = function (nextScene) {
                console.log("Scene deactivation:", this.toString());
            };
            /**
             * Add an actor to the list of actors that exist in this scene. This will cause the scene to
             * automatically invoke the update and render methods on this actor while this scene is active.
             *
             * @param actor the actor to add to the scene
             * @see Scene.addActorArray
             */
            Scene.prototype.addActor = function (actor) {
                this._actorList.push(actor);
            };
            /**
             * Add all of the actors from the passed in array to the list of actors that exist in this scene. This
             * will cause the scene to automatically invoke the update and render methods on these actors while
             * the scene is active.
             *
             * @param actorArray the list of actors to add
             * @see Scene.addActorArray
             */
            Scene.prototype.addActorArray = function (actorArray) {
                for (var i = 0; i < actorArray.length; i++)
                    this.addActor(actorArray[i]);
            };
            /**
             * Return a list of actors whose position matches the position passed in. This is probably most useful
             * when actors are at rigidly defined locations, such as in a tile based game. Note that this
             * checks the world position of the actor and not its map position.
             *
             * @param location the location to search for actors at, in world coordinates
             * @returns {Array<Actor>} the actors found at the given location, which may be none
             * @see Scene.actorsAtXY
             * @see Scene.actorsAtMap
             * @see Scene.actorsAtMapXY
             */
            Scene.prototype.actorsAt = function (location) {
                return this.actorsAtXY(location.x, location.y);
            };
            /**
             * Return a list of actors whose position matches the position passed in. This is probably most useful
             * when actors are at rigidly defined locations, such as in a tile based game. Note that this
             * checks the world position of the actor and not its map position.
             *
             * @param x the x coordinate to search for actors at, in world coordinates
             * @param y the y coordinate to search for actors at, in world coordinates
             * @returns {Array<Actor>} the actors found at the given location, which may be none
             * @see Scene.actorsAt
             * @see Scene.actorsAtMap
             * @see Scene.actorsAtMapXY
             */
            Scene.prototype.actorsAtXY = function (x, y) {
                var retVal = [];
                for (var i = 0; i < this._actorList.length; i++) {
                    var actor = this._actorList[i];
                    if (actor.position.x == x && actor.position.y == y)
                        retVal.push(actor);
                }
                return retVal;
            };
            /**
             * Return a list of actors whose position matches the position passed in. This checks the map
             * position of entities, and so is probably more useful than actorsAt() is in the general case. In
             * particular, since the map position and the world position are maintained, this lets you find
             * entities that are positioned anywhere within the tile grid.
             *
             * @param location the location to search for actors at, in map coordinates
             *
             * @returns {Array<Actor>} the actors found at the given location, which may be none
             * @see Scene.actorsAt
             * @see Scene.actorsAtXY
             * @see Scene.actorsAtMapXY
             */
            Scene.prototype.actorsAtMap = function (location) {
                return this.actorsAtMapXY(location.x, location.y);
            };
            /**
             * Return a list of actors whose position matches the position passed in. This checks the map
             * position of entities, and so is probably more useful than actorsAtXY() is in the general case. In
             * particular, since the map position and the world position are maintained, this lets you find
             * entities that are positioned anywhere within the tile grid.
             *
             * @param x the x coordinate to search for actors at, in map coordinates
             * @param y the y coordinate to search for actors at, in map coordinates
             * @returns {Array<Actor>} the actors found at the given location, which may be none
             * @see Scene.actorsAt
             * @see Scene.actorsAtXY
             * @see Scene.actorsAtMap
             */
            Scene.prototype.actorsAtMapXY = function (x, y) {
                var retVal = [];
                for (var i = 0; i < this._actorList.length; i++) {
                    var actor = this._actorList[i];
                    if (actor.mapPosition.x == x && actor.mapPosition.y == y)
                        retVal.push(actor);
                }
                return retVal;
            };
            /**
             * This method will sort all of the actors that are currently attached to the scene by their current
             * internal Z-Order value, so that when they are iterated for rendering/updates, they get handled in
             * an appropriate order.
             *
             * Note that the sort used is not stable.
             */
            Scene.prototype.sortActors = function () {
                this._actorList.sort(function (left, right) { return left.zOrder - right.zOrder; });
            };
            /**
             * This gets triggered while the game is running, this scene is the current scene, and a key has been
             * pressed down.
             *
             * The method should return true if the key event was handled or false if it was not. The Stage will
             * prevent the default handling for all key events that are handled.
             *
             * @param eventObj the event object
             * @returns {boolean} true if the key event was handled, false otherwise
             */
            Scene.prototype.inputKeyDown = function (eventObj) {
                return false;
            };
            /**
             * This gets triggered while the game is running, this scene is the current scene, and a key has been
             * released.
             *
             * The method should return true if the key event was handled or false if it was not. The Stage will
             * prevent the default handling for all key events that are handled.
             *
             * @param eventObj the event object
             * @returns {boolean} true if the key event was handled, false otherwise
             */
            Scene.prototype.inputKeyUp = function (eventObj) {
                return false;
            };
            /**
             * This gets triggered while the game is running, this scene is the current scene, and the mouse
             * moves over the stage.
             *
             * The method should return true if the mouse event was handled or false if it was not. The Stage
             * will prevent the default handling for all mouse events that are handled.
             *
             * @param eventObj the event object
             * @see Stage.calculateMousePos
             */
            Scene.prototype.inputMouseMove = function (eventObj) {
                return false;
            };
            /**
             * This gets triggered while the game is running, this scene is the current scene, and the mouse
             * is clicked on the stage.
             *
             * The method should return true if the mouse event was handled or false if it was not. The Stage
             * will prevent the default handling for all mouse events that are handled.
             *
             * @param eventObj the event object
             * @see Stage.calculateMousePos
             */
            Scene.prototype.inputMouseClick = function (eventObj) {
                return false;
            };
            /**
             * Open a new tab/window that displays the current contents of the stage. The generated page will
             * display the image and is set up so that a click on the image will cause the browser to download
             * the file.
             *
             * The filename you provide is the filename that is automatically suggested for the image, and the
             * title passed in will be the title of the window opened and also the alternate text for the image
             * on the page.
             *
             * The filename provided will have an identifying number and an extension appended to the end. The
             * window title will also have the screenshot number appended to the end of it. This allows you to
             * easily distinguish multiple screenshots.
             *
             * This all requires support from the current browser. Some browsers may not support the notion of
             * automatically downloading the image on a click, some might not use the filename provided.
             *
             * In particular, the browser in use needs to support data URI's. I assume most decent ones do.
             *
             * @param filename the name of the screenshot image to create
             * @param windowTitle the title of the window
             */
            Scene.prototype.screenshot = function (filename, windowTitle) {
                if (filename === void 0) { filename = "screenshot"; }
                if (windowTitle === void 0) { windowTitle = "Screenshot"; }
                // Create a window to hold the screen shot.
                var wind = window.open("about:blank", "screenshot");
                // Create a special data URI which the browser will interpret as an image to display.
                var imageURL = this._stage.canvas.toDataURL();
                // Append the screenshot number to the window title and also to the filename for the generated
                // image, then advance the screenshot counter for the next image.
                filename += ((Scene._ss_format + Scene._ss_number).slice(-Scene._ss_format.length)) + ".png";
                windowTitle += " " + Scene._ss_number;
                Scene._ss_number++;
                // Now we need to write some HTML into the new document. The image tag using our data URL will
                // cause the browser to display the image. Wrapping it in the anchor tag with the same URL and a
                // download attribute is a hint to the browser that when the image is clicked, it should download
                // it using the name provided.
                //
                // This might not work in all browsers, in which case clicking the link just displays the image.
                // You can always save via a right click.
                wind.document.write("<head><title>" + windowTitle + "</title></head>");
                wind.document.write('<a href="' + imageURL + '" download="' + filename + '">');
                wind.document.write('<img src="' + imageURL + '" title="' + windowTitle + '"/>');
                wind.document.write('</a>');
            };
            /**
             * Return a string representation of the object, for debugging purposes.
             *
             * @returns {String} a debug string representation
             */
            Scene.prototype.toString = function () {
                return String.format("[Scene name={0}]", this._name);
            };
            /**
             * Every time a screenshot is generated, this value is used in the filename. It is then incremented.
             *
             * @type {number}
             */
            Scene._ss_number = 0;
            /**
             * This template is used to determine the number at the end of a screenshot filename. The end
             * characters are replaced with the current number of the screenshot. This implicitly specifies
             * how many screenshots can be taken in the same session without the filename overflowing.
             *
             * @type {string}
             */
            Scene._ss_format = "0000";
            return Scene;
        })();
        game.Scene = Scene;
    })(game = nurdz.game || (nurdz.game = {}));
})(nurdz || (nurdz = {}));
var nurdz;
(function (nurdz) {
    var game;
    (function (game) {
        /**
         * This enum is used in the drawArrow method to determine what end of the line that makes up the arrow
         * a head should be drawn at.
         */
        (function (ArrowType) {
            /**
             * Neither end of the line should have an arrow head. This is just basically a slightly more
             * expensive call to draw a simple line.
             */
            ArrowType[ArrowType["NONE"] = 0] = "NONE";
            /**
             * The start of the line should have an arrowhead.
             */
            ArrowType[ArrowType["START"] = 1] = "START";
            /**
             * The end of the line should have an arrowhead.
             */
            ArrowType[ArrowType["END"] = 2] = "END";
            /**
             * Both ends of the line should have an arrowhead.
             */
            ArrowType[ArrowType["BOTH"] = 3] = "BOTH";
        })(game.ArrowType || (game.ArrowType = {}));
        var ArrowType = game.ArrowType;
        /**
         * This enum is used in the drawArrow method to determine what kind of arrow head to render onto the
         * arrow.
         *
         * Most of these provide an arrow with a curved head and just vary the method used to draw the curve,
         * which has subtle effects on how the curve appears.
         */
        (function (ArrowStyle) {
            /**
             * The arrowhead is curved using a simple arc.
             */
            ArrowStyle[ArrowStyle["ARC"] = 0] = "ARC";
            /**
             * The arrowhead has a straight line end
             */
            ArrowStyle[ArrowStyle["STRAIGHT"] = 1] = "STRAIGHT";
            /**
             * The arrowhead is unfilled with no end (it looks like a V)
             */
            ArrowStyle[ArrowStyle["UNFILLED"] = 2] = "UNFILLED";
            /**
             * The arrowhead is curved using a quadratic curve.
             */
            ArrowStyle[ArrowStyle["QUADRATIC"] = 3] = "QUADRATIC";
            /**
             * The arrowhead is curbed using a bezier curve
             */
            ArrowStyle[ArrowStyle["BEZIER"] = 4] = "BEZIER";
        })(game.ArrowStyle || (game.ArrowStyle = {}));
        var ArrowStyle = game.ArrowStyle;
    })(game = nurdz.game || (nurdz.game = {}));
})(nurdz || (nurdz = {}));
var nurdz;
(function (nurdz) {
    var game;
    (function (game) {
        /**
         * This class represents the stage area in the page, which is where the game renders itself.
         *
         * The class knows how to create the stage and do some rendering. This is also where the core
         * rendering loop is contained.
         */
        var CanvasRenderer = (function () {
            /**
             * Construct an instance of the class that knows how to render to the canvas provided. All
             * rendering will be performed by this canvas.
             *
             * This class assumes that the canvas is the entire size of the stage.
             *
             * @param canvas the canvas to use for rendering
             */
            function CanvasRenderer(canvas) {
                // Set our internal canvas context based on the canvas we were given.
                this._canvasContext = canvas.getContext('2d');
            }
            Object.defineProperty(CanvasRenderer.prototype, "width", {
                /**
                 * The width of the stage, in pixels. This is set at creation time and cannot change.
                 *
                 * @type {number} the width of the stage area in pixels
                 */
                get: function () { return game.STAGE_WIDTH; },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(CanvasRenderer.prototype, "height", {
                /**
                 * The height of the stage, in pixels. This is set at creation time and cannot change.
                 *
                 * @type {number} the height of the stage area in pixels
                 */
                get: function () { return game.STAGE_HEIGHT; },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(CanvasRenderer.prototype, "context", {
                /**
                 * Get the underlying rendering context for the stage.
                 *
                 * @returns {CanvasRenderingContext2D} the underlying rendering context for the stage
                 */
                get: function () { return this._canvasContext; },
                enumerable: true,
                configurable: true
            });
            /**
             * Clear the entire rendering area with the provided color.
             *
             * @param color the color to clear the stage with.
             */
            CanvasRenderer.prototype.clear = function (color) {
                if (color === void 0) { color = 'black'; }
                this._canvasContext.fillStyle = color;
                this._canvasContext.fillRect(0, 0, game.STAGE_WIDTH, game.STAGE_HEIGHT);
            };
            /**
             * Render a filled rectangle with its upper left corner at the position provided and with the provided
             * dimensions.
             *
             * @param x X location of the upper left corner of the rectangle
             * @param y Y location of the upper left corner of the rectangle
             * @param width width of the rectangle to render
             * @param height height of the rectangle to render
             * @param color the color to fill the rectangle with
             */
            CanvasRenderer.prototype.fillRect = function (x, y, width, height, color) {
                this._canvasContext.fillStyle = color;
                this._canvasContext.fillRect(x, y, width, height);
            };
            /**
             * Render a filled circle with its center at the position provided.
             *
             * @param x X location of the center of the circle
             * @param y Y location of the center of the circle
             * @param radius radius of the circle to draw
             * @param color the color to fill the circle with
             */
            CanvasRenderer.prototype.fillCircle = function (x, y, radius, color) {
                this._canvasContext.fillStyle = color;
                this._canvasContext.beginPath();
                this._canvasContext.arc(x, y, radius, 0, Math.PI * 2, true);
                this._canvasContext.fill();
            };
            /**
             * Render an arbitrary polygon by connecting all of the points provided in the polygon and then
             * filling the result.
             *
             * The points should be in the polygon in clockwise order.
             *
             * @param pointList the list of points that describe the polygon to render.
             * @param color the color to fill the polygon with.
             */
            CanvasRenderer.prototype.fillPolygon = function (pointList, color) {
                // Set the color and begin our polygon.
                this._canvasContext.fillStyle = color;
                this._canvasContext.beginPath();
                // Use the first point to start the polygon, then join the rest of the points together in turn.
                this._canvasContext.moveTo(pointList[0][0], pointList[0][1]);
                for (var i = 1; i < pointList.length; i++)
                    this._canvasContext.lineTo(pointList[i][0], pointList[i][1]);
                // FIll the shape now. This closes the shape by connecting the start and end point for us.
                this._canvasContext.fill();
            };
            /**
             * This helper method sets all of the styles necessary for rendering lines to the stage. This can be
             * called before drawing operations as a convenience to set all desired values in one call.
             *
             * NOTE: The values set here *do not* persist unless you never change them anywhere else. This
             * includes setting arrow styles.
             *
             * @param color the color to draw lines with
             * @param lineWidth] the pixel width of rendered lines
             * @param lineCap the line cap style to use for rendering lines
             * @see Render.setArrowStyle
             */
            CanvasRenderer.prototype.setLineStyle = function (color, lineWidth, lineCap) {
                if (lineWidth === void 0) { lineWidth = 3; }
                if (lineCap === void 0) { lineCap = "round"; }
                this._canvasContext.strokeStyle = color;
                this._canvasContext.lineWidth = lineWidth;
                this._canvasContext.lineCap = lineCap;
            };
            /**
             * This helper method draws the actual arrow head onto the canvas for a line. It assumes that all
             * styles have been set.
             *
             * The original drawArrow code allows its style parameter to be an instance of a function with this
             * signature to allow for custom arrow drawing, but that was removed.
             *
             * The function takes three sets of coordinates, which represent the endpoint of the line that the
             * arrow head is being drawn for (which is where the tip of the arrow should be), and the two
             * endpoints for the ends of the arrow head. These three points connected together form the arrow
             * head, though you are free to join them in any way you like (lines, arcs, etc).
             *
             * @param x0 the X coordinate of the left end of the arrow head line
             * @param y0 the Y coordinate of the left end of the arrow head line
             * @param x1 the X coordinate of the end of the line
             * @param y1 the Y coordinate of the end of the line
             * @param x2 the X coordinate of the right end of the arrow head line
             * @param y2 the Y coordinate of the right end of the arrow head line
             * @param style the style of arrow to drw
             */
            CanvasRenderer.prototype.drawHead = function (x0, y0, x1, y1, x2, y2, style) {
                var backDistance;
                // First, the common drawing operations. Generate a line from the left of the arrow head to the
                // point of the arrow and then down the other side.
                this._canvasContext.save();
                this._canvasContext.beginPath();
                this._canvasContext.moveTo(x0, y0);
                this._canvasContext.lineTo(x1, y1);
                this._canvasContext.lineTo(x2, y2);
                // Now use the style to finish the arrow head.
                switch (style) {
                    // The arrow head has a curved line that connects the two sides together.
                    case 0:
                        backDistance = Math.sqrt(((x2 - x0) * (x2 - x0)) + ((y2 - y0) * (y2 - y0)));
                        this._canvasContext.arcTo(x1, y1, x0, y0, .55 * backDistance);
                        this._canvasContext.fill();
                        break;
                    // The arrow head has a straight line that connects the two sides together.
                    case 1:
                        this._canvasContext.beginPath();
                        this._canvasContext.moveTo(x0, y0);
                        this._canvasContext.lineTo(x1, y1);
                        this._canvasContext.lineTo(x2, y2);
                        this._canvasContext.lineTo(x0, y0);
                        this._canvasContext.fill();
                        break;
                    // The arrow head is unfilled, so we're already done.
                    case 2:
                        this._canvasContext.stroke();
                        break;
                    // The arrow head has a curved line, but the arc is a quadratic curve instead of just a
                    // simple arc.
                    case 3:
                        var cpx = (x0 + x1 + x2) / 3;
                        var cpy = (y0 + y1 + y2) / 3;
                        this._canvasContext.quadraticCurveTo(cpx, cpy, x0, y0);
                        this._canvasContext.fill();
                        break;
                    // The arrow has a curved line, but the arc is a bezier curve instead of just a simple arc.
                    case 4:
                        var cp1x, cp1y, cp2x, cp2y;
                        var shiftAmt = 5;
                        if (x2 == x0) {
                            // Avoid a divide by zero if x2==x0
                            backDistance = y2 - y0;
                            cp1x = (x1 + x0) / 2;
                            cp2x = (x1 + x0) / 2;
                            cp1y = y1 + backDistance / shiftAmt;
                            cp2y = y1 - backDistance / shiftAmt;
                        }
                        else {
                            backDistance = Math.sqrt(((x2 - x0) * (x2 - x0)) + ((y2 - y0) * (y2 - y0)));
                            var xBack = (x0 + x2) / 2;
                            var yBack = (y0 + y2) / 2;
                            var xMid = (xBack + x1) / 2;
                            var yMid = (yBack + y1) / 2;
                            var m = (y2 - y0) / (x2 - x0);
                            var dX = (backDistance / (2 * Math.sqrt(m * m + 1))) / shiftAmt;
                            var dY = m * dX;
                            cp1x = xMid - dX;
                            cp1y = yMid - dY;
                            cp2x = xMid + dX;
                            cp2y = yMid + dY;
                        }
                        this._canvasContext.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x0, y0);
                        this._canvasContext.fill();
                        break;
                }
                this._canvasContext.restore();
            };
            /**
             * Set the style for all subsequent drawArrow() calls to use when drawing arrows. This needs to be
             * called prior to drawing any arrows to ensure that the canvas style used to draw arrows is updated;
             * the value does not persist. In particular, changing line styles will also change this.
             *
             * @param color the color to draw an arrow with
             * @param lineWidth the width of the arrow line
             * @see Render.setLineStyle
             */
            CanvasRenderer.prototype.setArrowStyle = function (color, lineWidth) {
                if (lineWidth === void 0) { lineWidth = 2; }
                this._canvasContext.strokeStyle = color;
                this._canvasContext.fillStyle = color;
                this._canvasContext.lineWidth = lineWidth;
            };
            /**
             * The basis of this code comes from:
             *     http://www.dbp-consulting.com/tutorials/canvas/CanvasArrow.html
             *
             * It has been modified to fit here, which includes things like assuming nobody is going to pass
             * strings, different method for specifying defaults, etc.
             *
             * This will render a line from x1,y1 to x2,y2 and then draw an arrow head on one or both ends of the
             * line in a few different styles.
             *
             * The style parameter can be one of the following values:
             *   0: Arrowhead with an arc end
             *   1: Arrowhead with a straight line end
             *   2: Arrowhead that is unfilled with no end (looks like a V)
             *   3: Arrowhead with a quadratic curve end
             *   4: Arrowhead with a bezier curve end
             *
             * The which parameter indicates which end of the line gets an arrow head. This is a bit field where
             * the first bit indicates the end of the line and the second bit indicates the start of the line.
             *
             * It is also possible to specify the angle that the arrow head makes from the end of the line and the
             * length of the sides of the arrow head.
             *
             * The arrow is drawn using the style set by setArrowStyle(), which is a combination of a stoke and
             * fill color and a line width.
             *
             * @param x1 the X coordinate of the start of the line
             * @param y1 the Y coordinate of the start of the line
             * @param x2 the X coordinate of the end of the line
             * @param y2 the Y coordinate of the end of the line
             * @param style the style of the arrowhead
             * @param which the end of the line that gets the arrow head(s)
             * @param angle the angle the arrow head makes from the end of the line
             * @param d the length (in pixels) of the edges of the arrow head
             * @see Render.setArrowStyle
             */
            CanvasRenderer.prototype.drawArrow = function (x1, y1, x2, y2, style, which, angle, d) {
                if (style === void 0) { style = game.ArrowStyle.QUADRATIC; }
                if (which === void 0) { which = game.ArrowType.END; }
                if (angle === void 0) { angle = Math.PI / 8; }
                if (d === void 0) { d = 16; }
                // For ends with arrow we actually want to stop before we get to the arrow so that wide lines
                // won't put a flat end on the arrow caused by the rendered line end cap.
                var dist = Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
                var ratio = (dist - d / 3) / dist;
                var toX, toY, fromX, fromY;
                // When the first bit is set, the end point of the line gets an arrow.
                if ((which & 1) != 0) {
                    toX = Math.round(x1 + (x2 - x1) * ratio);
                    toY = Math.round(y1 + (y2 - y1) * ratio);
                }
                else {
                    toX = x2;
                    toY = y2;
                }
                // When the second bit is set, the start point of the line gets an arrow.
                if ((which & 2) != 0) {
                    fromX = x1 + (x2 - x1) * (1 - ratio);
                    fromY = y1 + (y2 - y1) * (1 - ratio);
                }
                else {
                    fromX = x1;
                    fromY = y1;
                }
                // Draw the shaft of the arrow
                this._canvasContext.beginPath();
                this._canvasContext.moveTo(fromX, fromY);
                this._canvasContext.lineTo(toX, toY);
                this._canvasContext.stroke();
                // Calculate the angle that the line is going so that we can align the arrow head properly.
                var lineAngle = Math.atan2(y2 - y1, x2 - x1);
                // Calculate the line length of the side of the arrow head. We know the length if the line was
                // straight, so we need to have its length when it's rotated to the angle that it is to be drawn
                // at. h is the line length of a side of the arrow head
                var h = Math.abs(d / Math.cos(angle));
                var angle1, angle2, topX, topY, botX, botY;
                // When the first bit is set, we want to draw an arrow head at the end of the line.
                if ((which & 1) != 0) {
                    angle1 = lineAngle + Math.PI + angle;
                    topX = x2 + Math.cos(angle1) * h;
                    topY = y2 + Math.sin(angle1) * h;
                    angle2 = lineAngle + Math.PI - angle;
                    botX = x2 + Math.cos(angle2) * h;
                    botY = y2 + Math.sin(angle2) * h;
                    this.drawHead(topX, topY, x2, y2, botX, botY, style);
                }
                // WHen the second bit is set, we want to draw an arrow head at the start of the line.
                if ((which & 2) != 0) {
                    angle1 = lineAngle + angle;
                    topX = x1 + Math.cos(angle1) * h;
                    topY = y1 + Math.sin(angle1) * h;
                    angle2 = lineAngle - angle;
                    botX = x1 + Math.cos(angle2) * h;
                    botY = y1 + Math.sin(angle2) * h;
                    this.drawHead(topX, topY, x1, y1, botX, botY, style);
                }
            };
            /**
             * Display text to the stage at the position provided. How the the text anchors to the point provided
             * needs to be set by you prior to calling. By default, the location specified is the top left
             * corner.
             *
             * This method will set the color to the color provided but all other font properties will be as they
             * were last set for the canvas.
             *
             * @param text the text to draw
             * @param x X location of the text
             * @param y Y location of the text
             * @param color the color to draw the text with
             */
            CanvasRenderer.prototype.drawTxt = function (text, x, y, color) {
                this._canvasContext.fillStyle = color;
                this._canvasContext.fillText(text, x, y);
            };
            /**
             * Displays a bitmap to the stage such that its upper left corner is at the point provided.
             *
             * @param bitmap the bitmap to display
             * @param x X location to display the bitmap at
             * @param y Y location to display the bitmap at
             * @see Render.blitCentered
             * @see Render.blitCenteredRotated
             */
            CanvasRenderer.prototype.blit = function (bitmap, x, y) {
                this._canvasContext.drawImage(bitmap, x, y);
            };
            /**
             * Displays a bitmap to the stage such that its center is at the point provided.
             *
             * @param bitmap the bitmap to display
             * @param x X location to display the center of the bitmap at
             * @param y Y location to display the center of the bitmap at
             * @see Render.blit
             * @see Render.blitCenteredRotated
             */
            CanvasRenderer.prototype.blitCentered = function (bitmap, x, y) {
                this.translateAndRotate(x, y);
                this._canvasContext.drawImage(bitmap, -(bitmap.width / 2), -(bitmap.height / 2));
            };
            /**
             * Display a bitmap to the stage such that its center is at the point provided. The bitmap is also
             * rotated according to the rotation value, which is an angle in radians.
             *
             * @param bitmap the bitmap to display
             * @param x X location to display the center of the bitmap at
             * @param y Y location to display the center of the bitmap at
             * @param angle the angle to rotate the bitmap to (in degrees)
             * @see Render.blit
             * @see Render.blitCentered
             */
            CanvasRenderer.prototype.blitCenteredRotated = function (bitmap, x, y, angle) {
                this.translateAndRotate(x, y, angle);
                this._canvasContext.drawImage(bitmap, -(bitmap.width / 2), -(bitmap.height / 2));
                this._canvasContext.restore();
            };
            /**
             * Do an (optional) translation and (optional) rotation of the stage canvas. You can perform one or
             * both operations. This implicitly saves the current canvas state on a stack so that it can be
             * restored later via a call to restore().
             *
             * When both an X and a Y value are provided, the canvas is translated so that the origin is moved in
             * the translation direction given. One or both values can be null to indicate that no translation is
             * desired.
             *
             * When the angle is not null, the canvas is rotated by that many degrees around the origin.
             *
             * The order of operations is always translation first and rotation second, because once the rotation
             * happens, the direction of the axes are no longer what you expect. In particular this means that you
             * should be careful about invoking this function when the canvas has already been translated and/or
             * rotated.
             *
             * Note that the current translation and rotation of the canvas is held on a stack, so every call to
             * this method needs to be balanced with a call to the restore() method.
             *
             * @param x the amount to translate on the X axis or null for no translation
             * @param y the amount to translate on the Y axis or null for no translation
             * @param angle the angle to rotate the canvas, in degrees or null for no translation
             * @see Render.restore
             */
            CanvasRenderer.prototype.translateAndRotate = function (x, y, angle) {
                if (x === void 0) { x = null; }
                if (y === void 0) { y = null; }
                if (angle === void 0) { angle = null; }
                // First, save the canvas context.
                this._canvasContext.save();
                // If we are translating, translate now.
                if (x != null && y != null)
                    this._canvasContext.translate(x, y);
                // If we are rotating, rotate now.
                if (angle != null)
                    this._canvasContext.rotate(angle * (Math.PI / 180));
            };
            /**
             * Restore the canvas state that was in effect the last time that translateAndRotate was invoked. This
             * needs to be invoked the same number of times as that function was invoked because the canvas state
             * is stored on a stack.
             *
             * @see Render.translateAndRotate
             */
            CanvasRenderer.prototype.restore = function () {
                this._canvasContext.restore();
            };
            /**
             * Return a string representation of the object, for debugging purposes.
             *
             * @returns {String} a debug string representation
             */
            CanvasRenderer.prototype.toString = function () {
                return String.format("[CanvasRenderer dimensions={0}x{1}, tileSize={2}]", game.STAGE_WIDTH, game.STAGE_HEIGHT, game.TILE_SIZE);
            };
            return CanvasRenderer;
        })();
        game.CanvasRenderer = CanvasRenderer;
    })(game = nurdz.game || (nurdz.game = {}));
})(nurdz || (nurdz = {}));
var nurdz;
(function (nurdz) {
    var game;
    (function (game) {
        /**
         * The FPS that the engine is currently running at. This is recalculated once per second so that
         * slow update times don't get averaged out over a longer run, which makes the number less useful.
         *
         * @type {number}
         */
        var _fps = 0;
        /**
         * When calculating FPS, this is the time that the most recent frame count started. Once we have
         * counted frames for an entire second, this is reset and the count starts again.
         *
         * @type {number}
         */
        var _startTime = 0;
        /**
         * When calculating FPS, this is the number of frames that we have seen over the last second. When
         * the startTime gets reset, so does this. This makes sure that spontaneous frame speed changes
         * (e.g. a scene bogging down) don't get averaged away.
         *
         * @type {number}
         */
        var _frameNumber = 0;
        /**
         * When the engine is running, this is the timer ID of the system timer that keeps the game loop
         * running. Otherwise, this is null.
         *
         * @type {number|null}
         */
        var _gameTimerID = null;
        /**
         * This class represents the stage area in the page, which is where the game renders itself.
         *
         * The class knows how to create the stage and do some rendering. This is also where the core
         * rendering loop is contained.
         */
        var Stage = (function () {
            /**
             * Create the stage on which all rendering for the game will be done.
             *
             * A canvas will be created and inserted into the DOM as the last child of the container DIV with the
             * ID provided.
             *
             * The CSS of the DIV will be modified to have a width and height of the canvas, with options that
             * cause it to center itself.
             *
             * @param containerDivID the ID of the DIV that should contain the created canvas
             * @param initialColor the color to clear the canvas to once it is created
             * @constructor
             * @throws {ReferenceError} if there is no element with the ID provided
             */
            function Stage(containerDivID, initialColor) {
                var _this = this;
                if (initialColor === void 0) { initialColor = 'black'; }
                /**
                 * This function gets executed in a loop to run the game. Each execution will cause an update and
                 * render to be issued to the current scene.
                 *
                 * In practice, this gets invoked on a timer at the desired FPS that the game should run at.
                 */
                this.sceneLoop = function () {
                    // Get the current time for this frame and the elapsed time since we started.
                    var currentTime = new Date().getTime();
                    var elapsedTime = (currentTime - _startTime) / 1000;
                    // This counts as a frame.
                    _frameNumber++;
                    // Calculate the FPS now. We floor this here because if FPS is for displaying on the screen
                    // you probably don't need a billion digits of precision.
                    _fps = Math.round(_frameNumber / elapsedTime);
                    // If a second or more has elapsed, reset the count. We don't want an average over time, we want
                    // the most recent numbers so that we can see momentary drops.
                    if (elapsedTime > 1) {
                        _startTime = new Date().getTime();
                        _frameNumber = 0;
                    }
                    try {
                        // Before we start the frame update, make sure that the current scene is correct, in case
                        // anyone asked for an update to occur.
                        _this._sceneManager.checkSceneSwitch();
                        // Do the frame update now
                        _this._sceneManager.currentScene.update();
                        _this._sceneManager.currentScene.render();
                    }
                    catch (error) {
                        console.log("Caught exception in sceneLoop(), stopping the game");
                        clearInterval(_gameTimerID);
                        _gameTimerID = null;
                        throw error;
                    }
                };
                /**
                 * Handler for key down events. This gets triggered whenever the game is running and any key is
                 * pressed.
                 *
                 * @param evt the event object for this event
                 */
                this.keyDownEvent = function (evt) {
                    if (_this._sceneManager.currentScene.inputKeyDown(evt))
                        evt.preventDefault();
                };
                /**
                 * Handler for key up events. This gets triggered whenever the game is running and any key is
                 * released.
                 *
                 * @param evt the event object for this event
                 */
                this.keyUpEvent = function (evt) {
                    if (_this._sceneManager.currentScene.inputKeyUp(evt))
                        evt.preventDefault();
                };
                /**
                 * Handler for mouse movement events. This gets triggered whenever the game is running and the mouse
                 * moves over the stage.
                 *
                 * @param evt the event object for this event
                 */
                this.mouseMoveEvent = function (evt) {
                    if (_this._sceneManager.currentScene.inputMouseMove(evt))
                        evt.preventDefault();
                };
                /**
                 * Handler for mouse movement events. This gets triggered whenever the game is running and the mouse
                 * is clicked over the canvas.
                 *
                 * @param evt the event object for this event
                 */
                this.mouseClickEvent = function (evt) {
                    if (_this._sceneManager.currentScene.inputMouseClick(evt))
                        evt.preventDefault();
                };
                /**
                 * Turn on input handling for the game. This will capture keyboard events from the document and mouse
                 * events for the canvas provided.
                 *
                 * @param canvas the canvas to listen for mouse events on.
                 */
                this.enableInputEvents = function (canvas) {
                    // Mouse events are specific to the canvas.
                    canvas.addEventListener('mousemove', _this.mouseMoveEvent);
                    canvas.addEventListener('mousedown', _this.mouseClickEvent);
                    // Keyboard events are document wide because a canvas can't hold the input focus.
                    document.addEventListener('keydown', _this.keyDownEvent);
                    document.addEventListener('keyup', _this.keyUpEvent);
                };
                /**
                 * Turn off input handling for the game. This will turn off keyboard events from the document and
                 * mouse events for the canvas provided.
                 */
                this.disableInputEvents = function (canvas) {
                    canvas.removeEventListener('mousemove', _this.mouseMoveEvent);
                    canvas.removeEventListener('mousedown', _this.mouseClickEvent);
                    document.removeEventListener('keydown', _this.keyDownEvent);
                    document.removeEventListener('keyup', _this.keyUpEvent);
                };
                // Set up our scene manager object.
                this._sceneManager = new game.SceneManager(this);
                // Obtain the container element that we want to insert the canvas into.
                var container = document.getElementById(containerDivID);
                if (container == null)
                    throw new ReferenceError("Unable to create stage: No such element with ID '" + containerDivID + "'");
                // Create the canvas and give it the appropriate dimensions.
                this._canvas = document.createElement("canvas");
                this._canvas.width = game.STAGE_WIDTH;
                this._canvas.height = game.STAGE_HEIGHT;
                // Modify the style of the container div to make it center horizontally.
                container.style.width = game.STAGE_WIDTH + "px";
                container.style.height = game.STAGE_HEIGHT + "px";
                container.style.marginLeft = "auto";
                container.style.marginRight = "auto";
                // Create our rendering object and then use it to clear the stage.
                this._renderer = new game.CanvasRenderer(this._canvas);
                this._renderer.clear(initialColor);
                // Append the canvas to the container
                container.appendChild(this._canvas);
            }
            Object.defineProperty(Stage.prototype, "width", {
                /**
                 * The width of the stage, in pixels. This is set at creation time and cannot change.
                 *
                 * @type {number} the width of the stage area in pixels
                 */
                get: function () { return game.STAGE_WIDTH; },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Stage.prototype, "height", {
                /**
                 * The height of the stage, in pixels. This is set at creation time and cannot change.
                 *
                 * @type {number} the height of the stage area in pixels
                 */
                get: function () { return game.STAGE_HEIGHT; },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Stage.prototype, "canvas", {
                /**
                 * Get the underlying canvas object for the stage.
                 *
                 * @returns {HTMLCanvasElement} the underlying canvas element for the stage
                 */
                get: function () { return this._canvas; },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Stage.prototype, "renderer", {
                /**
                 * Get the underlying rendering object for the stage. This is the object responsible for all
                 * rendering on the stage.
                 *
                 * @returns {Renderer} the underlying rendering object for the stage
                 */
                get: function () { return this._renderer; },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Stage.prototype, "fps", {
                /**
                 * The stage keeps track of the current frame rate that the update loop is being called at, and this
                 * returns the most recently calculated value. The value is recalculated once per second so that
                 * it is always a near instantaneous read of the current fps and not an average over the life of
                 * the game.
                 *
                 * @returns {Number} the current fps, which is o when the game is stopped orr just started
                 */
                get: function () { return _fps; },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Stage.prototype, "currentScene", {
                /**
                 * Determine what scene is the current scene on this stage.
                 *
                 * @returns {Scene}
                 */
                get: function () { return this._sceneManager.currentScene; },
                enumerable: true,
                configurable: true
            });
            /**
             * Start the game running. This will start with the scene that is currently set. The game will run
             * (or attempt to) at the frame rate you provide.
             *
             * When the stage is created, a default empty scene is initialized that will do nothing.
             *
             * @see Scene.switchToScene.
             * @see Stage.stop
             * @param fps the FPS to attempt to run at
             */
            Stage.prototype.run = function (fps) {
                if (fps === void 0) { fps = 30; }
                if (_gameTimerID != null)
                    throw new Error("Attempt to start the game running when it is already running");
                // Reset the variables we use for frame counts.
                _startTime = 0;
                _frameNumber = 0;
                // Fire off a timer to invoke our scene loop using an appropriate interval.
                _gameTimerID = setInterval(this.sceneLoop, 1000 / fps);
                // Turn on input events.
                this.enableInputEvents(this._canvas);
            };
            /**
             * Stop a running game. This halts the update loop but otherwise has no effect. Thus after this call,
             * the game just stops where it was.
             *
             * It is legal to start the game running again via another call to run(), so long as your scenes are
             * not time sensitive.
             *
             * @see Stage.run
             */
            Stage.prototype.stop = function () {
                // Make sure the game is running.
                if (_gameTimerID == null)
                    throw new Error("Attempt to stop the game when it is not running");
                // Stop it.
                clearInterval(_gameTimerID);
                _gameTimerID = null;
                // Turn off input events.
                this.disableInputEvents(this._canvas);
            };
            /**
             * Register a scene object with the stage using a textual name. This scene can then be switched to
             * via
             * the switchToScene method.
             *
             * You can invoke this with null as a scene object to remove a scene from the internal scene list.
             * You
             * can also register the same object multiple times with different names, if that's interesting to
             * you.
             *
             * It is an error to attempt to register a scene using the name of a scene that already exists.
             *
             * @param name the symbolic name to use for this scene
             * @param newScene the scene object to add
             * @see Scene.switchToScene
             */
            Stage.prototype.addScene = function (name, newScene) {
                if (newScene === void 0) { newScene = null; }
                this._sceneManager.addScene(name, newScene);
            };
            /**
             * Register a request to change the current scene to a different scene. The change will take effect at
             * the start of the next frame.
             *
             * If null is provided, a pending scene change will be cancelled.
             *
             * This method has no effect if the scene specified is already the current scene, is already going to
             * be switched to, or has a name that we do not recognize.
             *
             * @param {String} sceneName the name of the new scene to change to, or null to cancel a pending
             * change
             */
            Stage.prototype.switchToScene = function (sceneName) {
                if (sceneName === void 0) { sceneName = null; }
                // Indicate that we want to switch to the scene provided.
                this._sceneManager.switchToScene(sceneName);
                // If the game is not currently running, then perform the switch right now; external code
                // might want to switch the scene while the game is not running and we want the currentScene
                // property to track property.
                if (_gameTimerID == null)
                    this._sceneManager.checkSceneSwitch();
            };
            /**
             * Given an event that represents a mouse event for the stage, calculate the position that the mouse
             * is actually at relative to the top left of the stage. This is needed because the position of mouse
             * events is normally relative to the document itself, which may be larger than the actual window.
             *
             * @param mouseEvent the mouse movement or click event
             * @returns {Point} the point of the mouse click/pointer position on the stage
             */
            Stage.prototype.calculateMousePos = function (mouseEvent) {
                // Some math has to be done because the mouse position is relative to document, which may have
                // dimensions larger than the current viewable area of the browser window.
                //
                // As a result, we need to ensure that we take into account the position of the canvas in the
                // document AND the scroll position of the document.
                var rect = this._canvas.getBoundingClientRect();
                var root = document.documentElement;
                var mouseX = mouseEvent.clientX - rect.left - root.scrollLeft;
                var mouseY = mouseEvent.clientY - rect.top - root.scrollTop;
                return new game.Point(mouseX, mouseY);
            };
            /**
             * Return a string representation of the object, for debugging purposes.
             *
             * @returns {String} a debug string representation
             */
            Stage.prototype.toString = function () {
                return String.format("[Stage dimensions={0}x{1}, tileSize={2}]", game.STAGE_WIDTH, game.STAGE_HEIGHT, game.TILE_SIZE);
            };
            return Stage;
        })();
        game.Stage = Stage;
    })(game = nurdz.game || (nurdz.game = {}));
})(nurdz || (nurdz = {}));
var nurdz;
(function (nurdz) {
    var game;
    (function (game) {
        /**
         * This class wraps a list of known Scene instances and allows for switching between them and
         * querying/modifying the list of known scenes.
         *
         * This is used by the Stage class to manage the scenes in the game and switch between them.
         */
        var SceneManager = (function () {
            /**
             * Create a new instance of the Scene manager that will manage scenes for the passed in stage.
             *
             * @param stage the stage whose scenes we are managing.
             */
            function SceneManager(stage) {
                /**
                 * The currently active scene. This defaults to an empty instance initially so that all operations
                 * still work as expected while the engine is being set up, and to guard the developer from
                 * himself by forgetting to add one.
                 *
                 * @type {Scene}
                 */
                this._currentScene = null;
                /**
                 * The scene that should become active next (if any). When a scene change request happens, the
                 * scene to be switched to is stored in this value to ensure that the switch happens at the end of
                 * the current update cycle, which happens asynchronously.
                 *
                 * The value here is null when there is no scene change scheduled.
                 *
                 * @type {Scene|null}
                 */
                this._nextScene = null;
                /**
                 * A list of all of the registered scenes in the stage. The keys are a symbolic string name and
                 * the values are the actual Scene instance objects that the names represent.
                 *
                 * @type {Object<String,Scene>}
                 */
                this._sceneList = null;
                // Set up a default current scene, so that things work while setup is happening.
                this._currentScene = new game.Scene("defaultScene", stage);
                // The scene list starts out initially empty.
                this._sceneList = {};
            }
            Object.defineProperty(SceneManager.prototype, "currentScene", {
                /**
                 * The currently active scene in the game.
                 *
                 * @returns {Scene} the current scene
                 */
                get: function () { return this._currentScene; },
                enumerable: true,
                configurable: true
            });
            /**
             * Register a scene object using a textual name for reference. This scene can then be switched to
             * via the switchToScene method.
             *
             * You can invoke this with null as a scene object to remove a scene from the internal scene list or
             * register the same object multiple times with different names, if that's interesting to you.
             *
             * It is an error to attempt to register a scene using the name of a scene that already exists.
             *
             * @param name the symbolic name to use for this scene
             * @param newScene the scene object to add
             * @see Scene.switchToScene
             */
            SceneManager.prototype.addScene = function (name, newScene) {
                if (newScene === void 0) { newScene = null; }
                // If this name is in use and we were given a scene object, we should complain.
                if (this._sceneList[name] != null && newScene != null)
                    console.log("Warning: overwriting scene registration for scene named " + name);
                // Save the scene
                this._sceneList[name] = newScene;
            };
            /**
             * Register a request to change the current scene to a different scene.
             *
             * NOTE: Such a change will not occur until the next call to checkSceneSwitch(), which you should
             * do prior to any frame update. This means sure that the frame update keeps the same scene active
             * throughout (e.g. calling into one scene for update and another for render).
             *
             * If null is provided, a pending scene change will be cancelled out.
             *
             * This method has no effect if the scene specified is already the current scene, is already going to
             * be switched to, or has a name that we do not recognize. In that last case, a console log is
             * generated to indicate why the scene change is not happening.
             *
             * @param {String} sceneName the name of the new scene to change to, or null to cancel a pending
             * change
             */
            SceneManager.prototype.switchToScene = function (sceneName) {
                if (sceneName === void 0) { sceneName = null; }
                // Get the actual new scene, which might be null if the scene named passed in is null.
                var newScene = sceneName != null ? this._sceneList[sceneName] : null;
                // If we were given a scene name and there was no such scene, complain before we leave.
                if (sceneName != null && newScene == null) {
                    console.log("Attempt to switch to unknown scene named " + sceneName);
                    return;
                }
                this._nextScene = newScene;
            };
            /**
             * Check to see if there is a pending scene switch that should happen, as requested by an
             * invocation to switchToScene().
             *
             * If there is, the current scene is switched, with the scenes being notified as appropriate. If
             * there isn't, then nothing else happens.
             *
             * @see SceneManager.switchToScene
             */
            SceneManager.prototype.checkSceneSwitch = function () {
                // If there is a scene change scheduled, change it now.
                if (this._nextScene != null && this._nextScene !== this._currentScene) {
                    // Tell the current scene that it is deactivating and what scene is coming next.
                    this._currentScene.deactivating(this._nextScene);
                    // Save the current scene, then swap to the new one
                    var previousScene = this._currentScene;
                    this._currentScene = this._nextScene;
                    // Now tell the current scene that it is activating, telling it what scene used to be in
                    // effect.
                    this._currentScene.activating(previousScene);
                    // Clear the flag now.
                    this._nextScene = null;
                }
            };
            return SceneManager;
        })();
        game.SceneManager = SceneManager;
    })(game = nurdz.game || (nurdz.game = {}));
})(nurdz || (nurdz = {}));
var nurdz;
(function (nurdz) {
    var game;
    (function (game) {
        /**
         * This class represents a Tile in a game, for games that require that. This encapsulates information as
         * to what the textual (for debugging) and numeric (for map data) ID's of a tile are, as well as the
         * ability to render to a stage and provide other information such as blocking.
         */
        var Tile = (function () {
            /**
             * Construct a new tile instance with the given name and ID values. This instance will render
             * itself using the debug color provided (as a filled rectangle).
             *
             * @param name the textual name of this tile type, for debugging purposes
             * @param internalID the numeric id of this tile type, for use in map data
             * @param debugColor the color to render as in debug mode
             */
            function Tile(name, internalID, debugColor) {
                if (debugColor === void 0) { debugColor = 'yellow'; }
                // Save the passed in values.
                this._name = name;
                this._tileID = internalID;
                this._debugColor = debugColor;
            }
            Object.defineProperty(Tile.prototype, "name", {
                /**
                 * Get the textual name of this tile.
                 *
                 * @returns {string}
                 */
                get: function () { return this._name; },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Tile.prototype, "value", {
                /**
                 * Get the numeric id of this tile.
                 *
                 * @returns {number}
                 */
                get: function () { return this._tileID; },
                enumerable: true,
                configurable: true
            });
            /**
             * Query whether this tile blocks the movement of the provided actor on the map or not.
             *
             * By default all actors are blocked on this tile. Note that this means that there is no API contract
             * as far as the core engine code is concerned with regards to the actor value passed in being
             * non-null.
             *
             * @param actor the actor to check blocking for
             * @returns {boolean} true if the actor given cannot move over this tile, or false otherwise.
             */
            Tile.prototype.blocksActorMovement = function (actor) {
                return true;
            };
            /**
             * Render this tile to the location provided on the given stage.
             *
             * This default version of the method renders the tile as a solid rectangle of the appropriate
             * dimensions using the debug color given at construction time.
             *
             * @param x the x location to render the tile at, in stage coordinates (NOT world)
             * @param y the y location to render the tile at, in stage coordinates (NOT world)
             * @param renderer the renderer to use to render ourselves.
             */
            Tile.prototype.render = function (x, y, renderer) {
                renderer.fillRect(x, y, game.TILE_SIZE, game.TILE_SIZE, this._debugColor);
            };
            /**
             * Return a string representation of the object, for debugging purposes.
             *
             * @returns {String} a debug string representation
             */
            Tile.prototype.toString = function () {
                return String.format("[Tile name={0} id={1}]", this._name, this._tileID);
            };
            return Tile;
        })();
        game.Tile = Tile;
    })(game = nurdz.game || (nurdz.game = {}));
})(nurdz || (nurdz = {}));
var nurdz;
(function (nurdz) {
    var game;
    (function (game) {
        /**
         * This class represents a Tileset in a game, which is basically just an array of Tile instances that
         * will be used to render a level. The class provides the ability to look up tiles based on either
         * their name or their numeric ID values, as well as validating whether or not tiles are valid.
         */
        var Tileset = (function () {
            /**
             * Construct a new tile instance with the given name and ID values. This instance will render
             * itself using the debug color provided (as a filled rectangle).
             *
             * @param name the textual name of this tile type, for debugging purposes
             * @param tiles the list of tiles that this tileset should contain
             */
            function Tileset(name, tiles) {
                // Save the name and the list of the tile length.
                this._name = name;
                this._length = tiles.length;
                // Set up our two cross reference object.
                this._tilesByName = {};
                this._tilesByValue = [];
                // Iterate and store all values. We don't just copy the tile array given as our tilesByValue
                // because we want to ensure that their indexes are their actual values.
                for (var i = 0; i < tiles.length; i++) {
                    var thisTile = tiles[i];
                    // If this tile has a name or numeric ID of an existing tile, generate a warning to the
                    // console so that the developer knows that he's boned something up.
                    if (this._tilesByName[thisTile.name] != null)
                        console.log("Duplicate tile with textual name '" + thisTile.name + "' found");
                    if (this._tilesByValue[thisTile.value] != null)
                        console.log("Duplicate tile with numeric id '" + thisTile.value + "' found");
                    this._tilesByName[thisTile.name] = thisTile;
                    this._tilesByValue[thisTile.value] = thisTile;
                }
            }
            /**
             * Given a tileID, return true if this tileset contains that tile or false if it does not.
             *
             * @param tileID the tileID to check.
             * @returns {boolean} true if the tileID given corresponds to a valid tile, false otherwise
             */
            Tileset.prototype.isValidTileID = function (tileID) {
                return this._tilesByValue[tileID] != null;
            };
            /**
             * Given a tile name, return back the tile object that represents this tile. The value will be null if
             * the tile name provided is not recognized.
             *
             * @param name the name of the tileID to search for
             * @returns {Tile} the tile with the provided name, or null if the name is invalid.
             */
            Tileset.prototype.tileForName = function (name) {
                return this._tilesByName[name];
            };
            /**
             * Given a tile id, return back the tile object that represents this tile. The value will be null
             * if the tile id provided is not recognized.
             *
             * @param id the numeric id value of the tile to search for
             * @returns {Tile} the tile with the provided value, or null if the name is invalid.
             */
            Tileset.prototype.tileForID = function (id) {
                return this._tilesByValue[id];
            };
            /**
             * Return a string representation of the object, for debugging purposes.
             *
             * @returns {String} a debug string representation
             */
            Tileset.prototype.toString = function () {
                return String.format("[Tileset name={0} tileCount={1}]", this._name, this._length);
            };
            return Tileset;
        })();
        game.Tileset = Tileset;
    })(game = nurdz.game || (nurdz.game = {}));
})(nurdz || (nurdz = {}));
var nurdz;
(function (nurdz) {
    var game;
    (function (game) {
        /**
         * This class represents the raw map and entity data that represents a tile based level in a game.
         * Instances of this class hold the raw (and reusable) data used to represent a level.
         *
         * The map data is just a series of integer tile ID values that associate with the tile set that has
         * been provided, as well as a list of entities that are attached to the map.
         *
         * Various checks are done to ensure that the level data provided is actually valid.
         */
        var LevelData = (function () {
            /**
             * Construct a new level data object with the provided properties.
             *
             * @param name the name of this level for debug purposes
             * @param width the width of the level in tiles
             * @param height the height of the level in tiles
             * @param levelData the actual data that represents the map for this level
             * @param entityList the list of entities that are contained in the map (may be empty)
             * @param tileset the tileset that this level is using.
             * @throws {Error} if the level data is inconsistent in some way
             */
            function LevelData(name, width, height, levelData, entityList, tileset) {
                // Save the provided values.
                this._name = name;
                this._width = width;
                this._height = height;
                this._levelData = levelData;
                this._entities = entityList;
                this._tileset = tileset;
                // Set up the entity list that associates with entity ID values.
                this._entitiesByID = {};
                // Iterate over all entities. For each one, insert it into the entitiesByID table and so some
                // validation.
                for (var i = 0; i < this._entities.length; i++) {
                    // Get the entity and it's ID property. If there is no ID property, generate an error.
                    var entity = this._entities[i];
                    var entityID = entity.properties.id;
                    if (entityID == null)
                        throw new Error("LevelData passed an entity with no 'id' property");
                    // The entity needs to have a stage associated with it.
                    if (entity.stage == null)
                        throw new Error("LevelData passed an entity that has no stage, id=" + entityID);
                    // Now store this entity in the lookup table; generate a warning if such an ID already
                    // exists, as it will clobber.
                    if (this._entitiesByID[entityID])
                        console.log("LevelData has an entity with a duplicate 'id' property: " + entityID);
                    this._entitiesByID[entityID] = entity;
                }
                // Validate the data now
                this.validateData();
            }
            Object.defineProperty(LevelData.prototype, "width", {
                /**
                 * The width of this level data, in tiles.
                 *
                 * @returns {number} the width of the map data in tiles.
                 */
                get: function () { return this._width; },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(LevelData.prototype, "height", {
                /**
                 * The height of this level data, in tiles.
                 *
                 * @returns {number} the height of the map data in tiles
                 */
                get: function () { return this._height; },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(LevelData.prototype, "mapData", {
                /**
                 * The underlying map data that describes the map in this instance. This is an array of numbers
                 * that are interpreted as numeric tile ID values and is width * height numbers long.
                 *
                 * @returns {Array<number>} the underlying map data
                 */
                get: function () { return this._levelData; },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(LevelData.prototype, "tileset", {
                /**
                 * The tileset that is used to render the map in this level data; the data in the mapData array is
                 * verified to only contain tiles that appear in this tileset.
                 *
                 * @returns {Tileset} the tileset to use to render this map
                 */
                get: function () { return this._tileset; },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(LevelData.prototype, "entities", {
                /**
                 * The list of all entities that are associated with this particular level data instance. This is
                 * just an array of entity objects.
                 *
                 * @returns {Array<Entity>} the list of entities
                 * @see LevelData.entitiesByID
                 */
                get: function () { return this._entities; },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(LevelData.prototype, "entitiesByID", {
                /**
                 * A duplicate list of entities, where the entities are indexed by their ID values for faster
                 * lookup at runtime.
                 *
                 * @returns {Object<String,Entity>} an object which contains the entities, keyed by their id values.
                 * @see LevelData.entities
                 */
                get: function () { return this._entitiesByID; },
                enumerable: true,
                configurable: true
            });
            /**
             * A simple helper that handles a validation failure by throwing an error.
             *
             * @param message the error to throw
             */
            LevelData.prototype.error = function (message) {
                throw new Error(message);
            };
            /**
             * Validate the data that is contained in this level to ensure that it is as consistent as we can
             * determine.
             *
             * On error, an error is thrown. Otherwise this returns without incident.
             *
             * @throws {Error} if the level data is inconsistent in some way
             */
            LevelData.prototype.validateData = function () {
                // Ensure that the length of the level data agrees with the dimensions that we were given, to make
                // sure we didn't get sorted.
                if (this._levelData.length != this._width * this._height)
                    this.error("Level data '" + this._name + "' has an incorrect length given its dimensions");
                // For now, there is no scrolling of levels, so it is important that the dimensions be the same
                // as the constant for the viewport.
                if (this._width != game.STAGE_TILE_WIDTH || this._height != game.STAGE_TILE_HEIGHT)
                    this.error("Scrolling is not implemented; level '" + this._name + "' must be the same size as the viewport");
                // Validate that all tiles are valid.
                for (var y = 0; y < this._height; y++) {
                    for (var x = 0; x < this._width; x++) {
                        // Pull a tileID out of the level data, and validate that the tileset knows what it is.
                        var tileID = this._levelData[y * this._width + x];
                        if (this._tileset.isValidTileID(tileID) == false)
                            this.error("Invalid tileID '${tileID}' found at [${x}, ${y}] in level ${this.name}");
                    }
                }
            };
            /**
             * Return a string representation of the object, for debugging purposes.
             *
             * @returns {String} a debug string representation
             */
            LevelData.prototype.toString = function () {
                return String.format("[LevelData name={0}, size={1}x{2]]", this._name, this._width, this._height);
            };
            return LevelData;
        })();
        game.LevelData = LevelData;
    })(game = nurdz.game || (nurdz.game = {}));
})(nurdz || (nurdz = {}));
var nurdz;
(function (nurdz) {
    var game;
    (function (game) {
        /**
         * This class represents the idea of a level in a game based on a tile map. It takes an instance of a
         * LevelData class that gives it information about the layout of the level and its other contents, and
         * provides an API for rendering that map to the stage and for querying the map data in various ways.
         */
        var Level = (function () {
            /**
             * Construct a new level object that will display on the provided stage and which represents the
             * provided data.
             *
             * @param stage the stage that owns the level and will display it
             * @param levelData the data to display/wrap/query
             */
            function Level(stage, levelData) {
                // Save the provided values and alias into the LevelData itself.
                this._stage = stage;
                this._width = levelData.width;
                this._height = levelData.height;
                this._mapData = levelData.mapData;
                this._entities = levelData.entities;
                this._entitiesByID = levelData.entitiesByID;
                this._tileset = levelData.tileset;
            }
            /**
             * Given an entity type, return back a list of all entities of that type that the level data contains.
             * There could be 0 or more such entries.
             *
             * @param type the entity type to search for (pass the class object)
             * @returns {Array<Entity>} an array of entities of this type, which might be empty
             */
            Level.prototype.entitiesWithType = function (type) {
                // The return value.
                var retVal = [];
                for (var i = 0; i < this._entities.length; i++) {
                    var entity = this._entities[i];
                    if (entity instanceof type)
                        retVal.push(entity);
                }
                return retVal;
            };
            /**
             * Given coordinates in the map (e.g. tile based) domain, return back a list of all entities in the
             * level that exist at this location, which might be 0. This also detects when the coordinates are
             * outside of the world.
             *
             * @param x the X coordinate to search, in map coordinates
             * @param y the Y coordinate to search, in map coordinates
             * @returns {Array<Entity>} the entities at the provided location or null if the location is
             * invalid
             */
            Level.prototype.entitiesAtMapXY = function (x, y) {
                // Return null if the coordinate is out of bounds.
                if (x < 0 || y < 0 || x >= this._width || y >= this._width)
                    return null;
                // Iterate over all entities to see if they are at the map location provided.
                var retVal = [];
                for (var i = 0; i < this._entities.length; i++) {
                    // Get the entity.
                    var entity = this._entities[i];
                    // If the location matches, add it to the array.
                    if (entity.mapPosition.equalsXY(x, y))
                        retVal.push(entity);
                }
                return retVal;
            };
            /**
             * Given coordinates in the map (e.g. tile based) domain, return back a list of all entities in the
             * level that exist at this location, which might be 0. This also detects when the coordinates are
             * outside of the world.
             *
             * @param  location the location in the map to check, in map coordinates
             * @returns {Array<Entity>} the entities at the provided location or null if the location is
             * invalid
             */
            Level.prototype.entitiesAtMapPosition = function (location) {
                return this.entitiesAtMapXY(location.x, location.y);
            };
            /**
             * Given coordinates in the map (e.g. tile based) domain and a facing, this calculates which map tile
             * is in the facing direction given and then returns back a list of all entities that exist at the
             * map tile that is adjacent in that direction, which might be 0. This also detects when either the
             * input or facing adjusted coordinates are outside of the world.
             *
             * @param x the X coordinate to search
             * @param y the Y coordinate to search
             * @param facing the facing to search (angle in degrees)
             * @returns {Array<Entity>} the entities at the provided location offset by the given facing or null
             * if the location is invalid (including if the location in the facing is invalid)
             */
            Level.prototype.entitiesAtMapXYFacing = function (x, y, facing) {
                // Based on the facing angle, adjust the map position as needed.
                switch (facing) {
                    case 0:
                        x++;
                        break;
                    case 90:
                        y++;
                        break;
                    case 180:
                        x--;
                        break;
                    case 270:
                        y--;
                        break;
                }
                // Now we can do a normal lookup.
                return this.entitiesAtMapXY(x, y);
            };
            /**
             * Given coordinates in the map (e.g. tile based) domain and a facing, this calculates which map tile
             * is in the facing direction given and then returns back a list of all entities that exist at the
             * map
             * tile that is adjacent in that direction, which might be 0. This also detects when either the input
             * or facing adjusted coordinates are outside of the world.
             *
             * @param location the location in the map to check, in map coordinates
             * @param facing the facing to search (angle in degrees)
             * @returns {Array<Entity>} the entities at the provided location offset by the given facing or null
             * if the location is invalid (including if the location in the facing is invalid)
             */
            Level.prototype.entitiesAtMapPositionFacing = function (location, facing) {
                return this.entitiesAtMapXYFacing(location.x, location.y, facing);
            };
            /**
             * Scan over all entities in the level and return back a list of all entities with the id or ids
             * given, which may be an empty array.
             *
             * NOTE: No care is taken to not include duplicate entities if the entity list provided contains the
             * same entity ID more than once. It's also not an error if no such entity exists, although a warning
             * will be generated to the console in this case.
             *
             * @param idSpec the array of entity IDs to find
             * @returns {Array<Entity>} list of matching entities (may be an empty array)
             */
            Level.prototype.entitiesWithIDs = function (idSpec) {
                var retVal = [];
                for (var i = 0; i < idSpec.length; i++) {
                    var entity = this._entitiesByID[idSpec[i]];
                    if (entity)
                        retVal.push(entity);
                }
                // This is just for debugging. We should get exactly as many things as were asked for. Less means
                // IDs were given that do not exist, more means that some objects have duplicate ID values, which
                // is also bad.
                if (retVal.length != idSpec.length)
                    console.log("Warning: entitiesWithIDs entity count mismatch. Broken level?");
                return retVal;
            };
            /**
             * Find all entities that match the id list passed in and then, for each such entity found, fire their
             * trigger method using the provided activator as the source of the trigger.
             *
             * As a convenience, if the idSpec provided is null, nothing happens. This allows for entities to use
             * this method without having to first verify that they actually have a trigger.
             *
             * @param idSpec the id or ids of entities to find or null too do nothing
             * @param activator the actor that is activating the entities, or null
             */
            Level.prototype.triggerEntitiesWithIDs = function (idSpec, activator) {
                // If there is not an idSpec, do nothing.
                if (idSpec == null)
                    return;
                // Get the list of entities that match the idSpec provided and trigger them all.
                var entities = this.entitiesWithIDs(idSpec);
                for (var i = 0; i < entities.length; i++)
                    entities[i].trigger(activator);
            };
            /**
             * Given coordinates in the map (e.g. tile based) domain, return back the tile at that location. If
             * the coordinates are outside of the world, this is detected and null is returned back.
             *
             * @param {Number} x the X-coordinate to check, in map coordinates
             * @param {Number} y the Y-coordinate to check, in map coordinates
             * @returns {Tile} the tile at the provided location or null if the location is invalid
             */
            Level.prototype.tileAtXY = function (x, y) {
                // Bounds check the location.
                if (x < 0 || y < 0 || x >= this._width || y >= this._width)
                    return null;
                // This is safe because the level data validates that all of the tiles in its data are also
                // represented in its tileset.
                return this._tileset.tileForID(this._mapData[y * this._width + x]);
            };
            /**
             * Given coordinates in the map (e.g. tile based) domain, return back the tile at that location. If
             * the coordinates are outside of the world, this is detected and null is returned back.
             *
             * @param location the location to check, in map coordinates
             * @returns {Tile} the tile at the provided location or null if the location is invalid
             */
            Level.prototype.tileAt = function (location) {
                return this.tileAtXY(location.x, location.y);
            };
            /**
             * Given coordinates in the map, return back a boolean that indicates if that space is blocked or not
             * as far as movement is concerned for the actor provided.
             *
             * The provided actor can be non-null, so long as all Tile and Entity instances being used in the
             * level are capable of determining blocking against a null tile reference. The default
             * implementations are capable of this.
             *
             * @param x the X-coordinate to check, in map coordinates
             * @param y the Y-coordinate to check, in map coordinates
             * @param actor the actor to check the blocking of
             * @returns {boolean} true if the level location is blocked for this actor and cannot be moved to, or
             * false otherwise.
             */
            Level.prototype.isBlockedAtXY = function (x, y, actor) {
                // Get the tile; it's blocked if it is out of bounds of the level.
                var tile = this.tileAtXY(x, y);
                if (tile == null)
                    return true;
                // If the tile at this location blocks actor movement, then the move is blocked.
                if (tile.blocksActorMovement(actor))
                    return true;
                // Get the list of entities that are at this location on the map. If there are any and any of them
                // blocks actor movement, the move is blocked.
                var entities = this.entitiesAtMapXY(x, y);
                if (entities != null) {
                    for (var i = 0; i < entities.length; i++) {
                        if (entities[i].blocksActorMovement(actor))
                            return true;
                    }
                }
                // Not blocked.
                return false;
            };
            /**
             * Given coordinates in the map, return back a boolean that indicates if that space is blocked or not
             * as far as movement is concerned for the actor provided.
             *
             * The provided actor can be non-null, so long as all Tile instances being used in the level are
             * capable of determining blocking against a null tile reference. The default Tile implementation
             * is capable of this.
             *
             * @param location the location to check, in map coordinates
             * @param actor the actor to check the blocking of
             * @returns {boolean} true if the level location is blocked for this actor and cannot be moved to, or
             * false otherwise.
             */
            Level.prototype.isBlockedAt = function (location, actor) {
                return this.isBlockedAtXY(location.x, location.y, actor);
            };
            /**
             * Render this level using the renderer provided. This is done by delegating the rendering of each
             * individual tile to the tile instance.
             *
             * Note that this only renders the level geometry and not the entities; it's up to the caller to
             * render those as needed and at the appropriate time.
             *
             * @param renderer the renderer to render with
             */
            Level.prototype.render = function (renderer) {
                // Iterate over the tiles.
                for (var y = 0; y < this._height; y++) {
                    for (var x = 0; x < this._width; x++) {
                        var tile = this.tileAtXY(x, y);
                        // Get the tile and render it.
                        if (tile != null)
                            tile.render(x * game.TILE_SIZE, y * game.TILE_SIZE, renderer);
                    }
                }
            };
            /**
             * Return a string representation of the object, for debugging purposes.
             *
             * @returns {String} a debug string representation
             */
            Level.prototype.toString = function () {
                return String.format("[LevelData size={0}x{1}]", this._width, this._height);
            };
            return Level;
        })();
        game.Level = Level;
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
            SegmentType[SegmentType["LEFT"] = 2] = "LEFT";
            SegmentType[SegmentType["RIGHT"] = 3] = "RIGHT";
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
            SegmentType[SegmentType["TOP"] = 4] = "TOP";
            SegmentType[SegmentType["BOTTOM"] = 5] = "BOTTOM";
            /**
             * This one is not valid and only here to tell us how many segment types there are, which is
             * important during debugging when we have to cycle between segments but otherwise is not
             * interesting.
             */
            SegmentType[SegmentType["SEGMENT_COUNT"] = 6] = "SEGMENT_COUNT";
        })(game.SegmentType || (game.SegmentType = {}));
        var SegmentType = game.SegmentType;
        /**
         * This controls the color that a segment renders as, as one of the three possible values.
         */
        (function (SegmentColor) {
            /**
             * The segment renders in the blue (chill) color.
             */
            SegmentColor[SegmentColor["BLUE"] = 0] = "BLUE";
            /**
             * The segment renders in the red (fever) color.
             */
            SegmentColor[SegmentColor["RED"] = 1] = "RED";
            /**
             * Te segment renders in the yellow (???) color.
             */
            SegmentColor[SegmentColor["YELLOW"] = 2] = "YELLOW";
        })(game.SegmentColor || (game.SegmentColor = {}));
        var SegmentColor = game.SegmentColor;
        /**
         * The colors to use when rendering the segments. This is meant to be indexed by an instance of
         * SegmentColor, so make sure that the order of things line up (including having the correct number of
         * items) unless you want things to not work.
         *
         * @type {Array<string>}
         */
        var RENDER_COLORS = ['#0033cc', '#cc3300', '#cccc00'];
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
         * @type {VirusPoints}
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
         * @type {VirusPoints}
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
         * @type {VirusPoints}
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
         * Everything that can be rendered inside of the bottle in the game is a segment of some sort, be it a
         * capsule portion, a virus or even just empty space.
         */
        var Segment = (function (_super) {
            __extends(Segment, _super);
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
                    color: color
                }, {}, '#909090');
                // If this is a virus, we need to set the polygon too.
                if (type == SegmentType.VIRUS)
                    this.virusPolygon = game.Utils.randomIntInRange(0, 2);
                // Lastly, we need to set up the color string based on the color specification we were given.
                this._properties.colorStr = RENDER_COLORS[this._properties.color];
            }
            Object.defineProperty(Segment.prototype, "properties", {
                get: function () { return this._properties; },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Segment.prototype, "virusPolygon", {
                /**
                 * Change the polygon used to render this segment when it is rendered as a virus.
                 *
                 * @param poly a value in the range of 0 to 2 inclusive, to select the appropriate virus polygon.
                 * Out of range values are treated as 0.
                 */
                set: function (poly) {
                    var polyArray = [virusOne, virusTwo, virusThree];
                    if (poly < 0 || poly > 2)
                        poly = 0;
                    this._properties.poly = polyArray[poly];
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Segment.prototype, "type", {
                /**
                 * Change the segment type of this segment to be the new type.
                 * @param type
                 */
                set: function (type) { this._properties.type = type; },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Segment.prototype, "color", {
                /**
                 * Change the segment color of this segment to be the new color.
                 */
                set: function (color) {
                    this._properties.color = color;
                    this._properties.colorStr = RENDER_COLORS[color];
                },
                enumerable: true,
                configurable: true
            });
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
            Segment.prototype.fillPolygon = function (renderer, points, color) {
                // Set the color and begin our polygon.
                renderer.context.fillStyle = color;
                renderer.context.beginPath();
                // Use the first point to start the polygon, then join the rest of the points together in turn.
                renderer.context.moveTo(points[0][0], points[0][1]);
                for (var i = 1; i < points.length; i++)
                    renderer.context.lineTo(points[i][0], points[i][1]);
                // FIll the shape now. This closes the shape by connecting the start and end point for us.
                renderer.context.fill();
            };
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
                this.fillPolygon(renderer, this._properties.poly.body, this._properties.colorStr);
                this.fillPolygon(renderer, this._properties.poly.leftEye, vColor);
                this.fillPolygon(renderer, this._properties.poly.rightEye, vColor);
                this.fillPolygon(renderer, this._properties.poly.mouth, vColor);
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
                // How we render depends on our type.
                switch (this._properties.type) {
                    // A single segment capsule is just a circle centered in the cell.
                    case SegmentType.SINGLE:
                        renderer.fillCircle(0, 0, SEGMENT_SIZE / 2, this._properties.colorStr);
                        return;
                    // The remainder of the cases are (or should be) one of the four capsule segments that are
                    // meant to be joined together to be a single capsule. This always renders as a right
                    // handed segment because we assume the canvas has been rotated as appropriate.
                    default:
                        // Draw the circular portion. This describes a half circle for a right hand capsule end.
                        renderer.context.fillStyle = this._properties.colorStr;
                        renderer.context.beginPath();
                        renderer.context.arc(0, 0, SEGMENT_SIZE / 2, Math.PI * 1.5, Math.PI / 2);
                        renderer.context.fill();
                        // Now draw a little rectangle in the same color to fill out the pill. Note that we use
                        // TILE_SIZE for the X position and the width, but the segment size for the Y position
                        // and the height.  This is on purpose; SEGMENT_SIZE represents how big the pill capsule
                        // segments should be to allow for a boundary between adjacent pills, but we want the
                        // flat edge of the segments to butt up against the side of their bounding boxes so that
                        // when two halves are together they don't appear to have a seam.
                        renderer.fillRect(-game.TILE_SIZE / 2, -SEGMENT_SIZE / 2, game.TILE_SIZE / 2, SEGMENT_SIZE, this._properties.colorStr);
                        return;
                }
            };
            Segment.prototype.render = function (x, y, renderer) {
                // Invoke the super, which will render a background for us at our dimensions, which we can use
                // for debugging purposes to ensure that we're drawing correctly.
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
                        renderer.translateAndRotate(x + (game.TILE_SIZE / 2), y + (game.TILE_SIZE / 2), 0);
                        break;
                }
                // Now call our capsule rendering method to do the actual drawing, then restore before we return.
                this.renderCapsuleSegment(renderer);
                renderer.restore();
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
         * The width of the pill bottle, in pills (tiles/segments).
         *
         * @type {number}
         */
        var BOTTLE_WIDTH = 8;
        /**
         * The height of the pill bottle, in pills (tiles/segments).
         *
         * @type {number}
         */
        var BOTTLE_HEIGHT = 16;
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
             */
            function Bottle(stage) {
                // Calculate how wide the bottle is, in pixels.
                var pixelWidth = BOTTLE_WIDTH * game.TILE_SIZE;
                // Configure ourselves to be large and in charge. We're centered on the screen and a couple of
                // tiles from the top of the screen.
                _super.call(this, "Bottle", stage, (stage.width / 2) - (pixelWidth / 2), 64, pixelWidth, BOTTLE_HEIGHT * game.TILE_SIZE, 1, {});
                // TODO This is not creating things empty like it should
                // Fill the bottle contents with empty segments.
                this._contents = [];
                for (var i = 0; i < BOTTLE_WIDTH * BOTTLE_HEIGHT; i++)
                    this._contents[i] = new game.Segment(stage, game.Utils.randomIntInRange(0, game.SegmentType.SEGMENT_COUNT - 1), game.Utils.randomIntInRange(0, 2));
            }
            /**
             * Render ourselves to the screen, along with our contents
             * @param x the X location to render at
             * @param y the Y location to render at
             * @param renderer the renderer to use to render ourselves
             */
            Bottle.prototype.render = function (x, y, renderer) {
                // Let the super render our background for us
                _super.prototype.render.call(this, x, y, renderer);
                for (var x_1 = 0; x_1 < BOTTLE_WIDTH; x_1++) {
                    for (var y_1 = 0; y_1 < BOTTLE_HEIGHT; y_1++) {
                        // Get the segment and render it.
                        var segment = this._contents[y_1 * BOTTLE_WIDTH + x_1];
                        segment.render(x_1 * game.TILE_SIZE + this._position.x, y_1 * game.TILE_SIZE + this._position.y, renderer);
                    }
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
                if (stagePos.x >= this._position.x && stagePos.y >= this._position.y &&
                    stagePos.x < this._position.x + this._width &&
                    stagePos.y < this._position.y + this._height) {
                    // Convert the position to a tile by first transforming the point to be relative to the
                    // origin of the screen and then constraining it to a tile dimension. We do this in a copy
                    // so as to not modify the point provided to us.
                    stagePos = stagePos.copyTranslatedXY(-this._position.x, -this._position.y).reduce(game.TILE_SIZE);
                    // Get the segment clicked on and twiddle its type.
                    return this._contents[stagePos.y * BOTTLE_WIDTH + stagePos.x];
                }
                // It's out of bounds.
                return null;
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
         * The scene in which our game is played. This is responsible for drawing the bottle, the pills, and
         * handling the input and game logic.
         */
        var GameScene = (function (_super) {
            __extends(GameScene, _super);
            /**
             * Construct a new game scene.
             *
             * @param name the name of this scene for debug purposes
             * @param stage the stage that manages this scene
             * @constructor
             */
            function GameScene(name, stage) {
                // Invoke the super to set up our instance.
                _super.call(this, name, stage);
                // Create a simple segment to use for debug rendering. The type and color don't really matter.
                this._debugSegment = new game.Segment(stage, game.SegmentType.EMPTY, game.SegmentColor.BLUE);
                // Create a bottle entity to hold the game board contents and add it as an actor so that its
                // update and render methods will get called.
                this._bottle = new game.Bottle(stage);
                this.addActor(this._bottle);
            }
            /**
             * Draw the debug segment at the provided X and Y location (specifying the top left of the cell in
             * which to display it), providing also the type it should render itself as and its color.
             *
             * If the type provided is virus, the virus polygon is also changed to the polygon value provided.
             *
             * @param x the X location to render at
             * @param y the Y location to render at
             * @param type the type to render as
             * @param color the color to use
             * @param poly the virus polygon to use (values between 0-2 inclusive()
             */
            GameScene.prototype.drawSegment = function (x, y, type, color, poly) {
                if (poly === void 0) { poly = 0; }
                // Swap the type and color, and then invoke the rendering method.
                this._debugSegment.type = type;
                if (type == game.SegmentType.VIRUS)
                    this._debugSegment.virusPolygon = poly;
                this._debugSegment.color = color;
                this._debugSegment.render(x, y, this._renderer);
            };
            /**
             * Render our scene.
             *
             * Currently this method DOES NOT chain to the superclass, so it doesn't render any actors/entities.
             */
            GameScene.prototype.render = function () {
                // Clear the canvas
                this._renderer.clear('black');
                // Draw one of each segment type in all of our colors.
                this.drawSegment(32, 32, game.SegmentType.SINGLE, game.SegmentColor.BLUE);
                this.drawSegment(64, 32, game.SegmentType.SINGLE, game.SegmentColor.RED);
                this.drawSegment(96, 32, game.SegmentType.SINGLE, game.SegmentColor.YELLOW);
                this.drawSegment(32, 64, game.SegmentType.TOP, game.SegmentColor.BLUE);
                this.drawSegment(64, 64, game.SegmentType.TOP, game.SegmentColor.RED);
                this.drawSegment(96, 64, game.SegmentType.TOP, game.SegmentColor.YELLOW);
                this.drawSegment(32, 96, game.SegmentType.BOTTOM, game.SegmentColor.BLUE);
                this.drawSegment(64, 96, game.SegmentType.BOTTOM, game.SegmentColor.RED);
                this.drawSegment(96, 96, game.SegmentType.BOTTOM, game.SegmentColor.YELLOW);
                this.drawSegment(32, 128, game.SegmentType.LEFT, game.SegmentColor.BLUE);
                this.drawSegment(64, 128, game.SegmentType.LEFT, game.SegmentColor.RED);
                this.drawSegment(96, 128, game.SegmentType.LEFT, game.SegmentColor.YELLOW);
                this.drawSegment(32, 160, game.SegmentType.RIGHT, game.SegmentColor.BLUE);
                this.drawSegment(64, 160, game.SegmentType.RIGHT, game.SegmentColor.RED);
                this.drawSegment(96, 160, game.SegmentType.RIGHT, game.SegmentColor.YELLOW);
                // Throw in a virus of each color. As a hack this manually swaps the polygon around every
                // time. Dear lord. The poly remains set until changed, so we only need to cause that
                // terribleness to happen three times per frame and not 9. Yay?
                this.drawSegment(32, 192, game.SegmentType.VIRUS, game.SegmentColor.BLUE, 0);
                this.drawSegment(64, 192, game.SegmentType.VIRUS, game.SegmentColor.RED);
                this.drawSegment(96, 192, game.SegmentType.VIRUS, game.SegmentColor.YELLOW);
                this._debugSegment.virusPolygon = 1;
                this.drawSegment(32, 224, game.SegmentType.VIRUS, game.SegmentColor.BLUE, 1);
                this.drawSegment(64, 224, game.SegmentType.VIRUS, game.SegmentColor.RED);
                this.drawSegment(96, 224, game.SegmentType.VIRUS, game.SegmentColor.YELLOW);
                this._debugSegment.virusPolygon = 2;
                this.drawSegment(32, 256, game.SegmentType.VIRUS, game.SegmentColor.BLUE, 2);
                this.drawSegment(64, 256, game.SegmentType.VIRUS, game.SegmentColor.RED);
                this.drawSegment(96, 256, game.SegmentType.VIRUS, game.SegmentColor.YELLOW);
                // Invoke the super to draw the bottle for us.
                _super.prototype.render.call(this);
            };
            /**
             * This triggers when a mouse click event happens.
             *
             * @param eventObj the mouse click event
             */
            GameScene.prototype.inputMouseClick = function (eventObj) {
                // Get the segment at the position where the mouse was clicked. It's null if the click didn't
                // happen inside the bottle contents area.
                var segment = this._bottle.segmentAtStagePosition(this._stage.calculateMousePos(eventObj));
                if (segment != null) {
                    segment.properties.type++;
                    if (segment.properties.type >= game.SegmentType.SEGMENT_COUNT)
                        segment.properties.type = 0;
                    if (segment.properties.type == game.SegmentType.VIRUS)
                        segment.virusPolygon = game.Utils.randomIntInRange(0, 2);
                }
                // Yeah, we did a thing, even if we didn't find a segment.
                return true;
            };
            /**
             * This triggers when a keyboard key is pressed.
             *
             * @param eventObj the event that represents the key pressed
             *
             * @returns {boolean} true if the key was handled, false otherwise.
             */
            GameScene.prototype.inputKeyDown = function (eventObj) {
                // F5 takes a screenshot.
                if (eventObj.keyCode == game.KeyCodes.KEY_F5) {
                    this.screenshot("rx", "Rx Clone Screenshot");
                    return true;
                }
                return _super.prototype.inputKeyDown.call(this, eventObj);
            };
            return GameScene;
        })(game.Scene);
        game.GameScene = GameScene;
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
                    if (gameRunning)
                        stage.stop();
                    else
                        stage.run();
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
                // Set up the button that will stop the game if something goes wrong.
                setupButton(stage, "controlBtn");
                // Register all of our scenes.
                stage.addScene("game", new nurdz.game.GameScene("gameScene", stage));
                // Switch to the initial scene, add a dot to display and then run the game.
                stage.switchToScene("game");
                stage.run();
            }
            catch (error) {
                console.log("Error starting the game");
                throw error;
            }
        });
    })(main = nurdz.main || (nurdz.main = {}));
})(nurdz || (nurdz = {}));
