module nurdz.game
{
    /**
     * This class represents a single point as a pair of X,Y coordinates. This also includes simple operations
     * such as setting and clamping of values, as well as making copies and comparisons.
     *
     * Most API functions provided come in a variety that takes an X,Y and one that takes another point,
     * so that calling code can use whatever it most appropriate for the situation without having to box
     * or un-box values.
     */
    export class Point
    {
        // TODO Should these members be private and accessed via accessor functions? Is that really slow?
        /**
         * X-coordinate of this point.
         *
         * @type {Number}
         */
        x : number;

        /**
         * Y-coordinate of this point.
         *
         * @type {Number}
         */
        y : number;

        /**
         * Construct a new point that uses the provided X and Y values as its initial coordinate.
         *
         * @param x X-coordinate of this point
         * @param y Y-coordinate of this point
         * @constructor
         */
        constructor (x : number, y : number)
        {
            this.x = x;
            this.y = y;
        }

        /**
         * Return a new point instance that is a copy of this point.
         *
         * @returns {Point} a duplicate of this point
         * @see Point.copyTranslatedXY
         */
        copy () : Point
        {
            return new Point (this.x, this.y);
        }

        /**
         * Return a new point instance that is a copy of this point, with its values translated by the values
         * passed in.
         *
         * @param translation the point to translate this point by
         * @returns {Point} a duplicate of this point, translated by the value passed in
         * @see Point.copy
         * @see Point.copyTranslatedXY
         */
        copyTranslated (translation : Point) : Point
        {
            return this.copyTranslatedXY (translation.x, translation.y);
        }

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
        copyTranslatedXY (x : number, y : number) : Point
        {
            var retVal = this.copy ();
            return retVal.translateXY (x, y);
        }

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
        copyReduced (factor : number) : Point
        {
            return this.copy ().reduce (factor);
        }

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
        copyScaled (scale : number) : Point
        {
            return this.copy ().scale (scale);
        }

        /**
         * Set the position of this point to the same as the point passed in.
         *
         * @param point the point to copy from
         * @returns {Point} this point after the operation completes, for chaining calls.
         */
        setTo (point : Point) : Point
        {
            return this.setToXY (point.x, point.y)
        }

        /**
         * Set the position of this point to the same as the values passed in
         *
         * @param x new X-coordinate for this point
         * @param y new Y-coordinate for this point
         * @returns {Point} this point after the operation completes, for chaining calls.
         */
        setToXY (x : number, y : number) : Point
        {
            this.x = x;
            this.y = y;
            return this;
        }

        /**
         * Compares this point to the point passed in to determine if they represent the same point.
         *
         * @param other the point to compare to
         * @returns {boolean} true or false depending on equality
         */
        equals (other : Point) : boolean
        {
            return this.x == other.x && this.y == other.y;
        }

        /**
         * Compares this point to the values passed in to determine if they represent the same point.
         *
         * @param x the X-coordinate to compare to
         * @param y the Y-coordinate to compare to
         * @returns {boolean} true or false depending on equality
         */
        equalsXY (x : number, y : number) : boolean
        {
            return this.x == x && this.y == y;
        }

        /**
         * Translate the location of this point using the values of the point passed in. No range checking is
         * done.
         *
         * @param delta the point that controls both delta values
         * @returns {Point} this point after the translation, for chaining calls.
         */
        translate (delta : Point) : Point
        {
            return this.translateXY (delta.x, delta.y);
        }

        /**
         * Translate the location of this point using the values passed in. No range checking is done.
         *
         * @param deltaX the change in X-coordinate
         * @param deltaY the change in Y-coordinate
         * @returns {Point} this point after the translation, for chaining calls.
         */
        translateXY (deltaX : number, deltaY : number) : Point
        {
            this.x += deltaX;
            this.y += deltaY;
            return this;
        }

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
        pointAtAngle (angle : number, distance : number) : Point
        {
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
            return new Point (Math.cos (angle), Math.sin (angle)).scale (distance).translate (this);
        }

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
        reduce (factor : number) : Point
        {
            this.x = Math.floor (this.x / factor);
            this.y = Math.floor (this.y / factor);
            return this;
        }

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
        scale (scale : number) : Point
        {
            this.x = Math.floor (this.x * scale);
            this.y = Math.floor (this.y * scale);
            return this;
        }

        /**
         * Clamp the value of the X-coordinate of this point so that it is between the min and max values
         * provided, inclusive.
         *
         * @param minX the minimum X-coordinate to allow
         * @param maxX the maximum Y-coordinate to allow
         * @returns {Point} this point after the clamp is completed, for chaining calls.
         */
        clampX (minX : number, maxX : number) : Point
        {
            if (this.x < minX)
                this.x = minX;
            else if (this.x > maxX)
                this.x = maxX;
            return this;

        }

        /**
         * Clamp the value of the Y-coordinate of this point so that it is between the min and max values
         * provided, inclusive.
         *
         * @param minY the minimum Y-coordinate to allow
         * @param maxY the maximum Y-coordinate to allow
         * @returns {Point} this point after the clamp is completed, for chaining calls.
         */
        clampY (minY : number, maxY : number) : Point
        {
            if (this.y < minY)
                this.y = minY;
            else if (this.y > maxY)
                this.y = maxY;
            return this;
        }

        /**
         * Clamp the X and Y values of the provided point so that they are within the bounds of the stage
         * provided.
         *
         * @param stage the stage to clamp to
         * @returns {Point} this point after the clamp is completed, for chaining calls.
         */
        clampToStage (stage : Stage)
        {
            this.clampX (0, stage.pixelWidth - 1);
            this.clampY (0, stage.pixelHeight - 1);
            return this;
        }

        /**
         * Return a string representation of the object, for debugging purposes.
         *
         * @returns {String} a debug string representation
         */
        toString () : string
        {
            // TODO This looks kinda ugly to me, bring String.format over instead
            return `[${this.x}, ${this.y}`;
        }
    }
}