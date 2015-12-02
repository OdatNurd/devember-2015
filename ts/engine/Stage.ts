// TODO Several things in this class are static when they should just be private since there is only one Stage
module nurdz.game
{
    /**
     * This class represents the stage area in the page, which is where the game renders itself.
     *
     * The class knows how to create the stage and do some rendering. This is also where the core
     * rendering loop is contained.
     */
    export class Stage
    {
        /**
         * The width of the stage, in pixels. This is set at creation time and cannot change.
         *
         * @const
         * @type {number}
         */
        private width : number = STAGE_WIDTH;

        /**
         * The height of the stage, in pixels. This is set at creation time and cannot change.
         *
         * @const
         * @type {number}
         */
        private height : number = STAGE_HEIGHT;

        /**
         * The canvas that the stage renders itself to.
         *
         * @type {HTMLCanvasElement}
         */
        private canvas : HTMLCanvasElement;

        /**
         * The rendering context for our canvas. This is the gateway to rendering magic.
         *
         * @type {CanvasRenderingContext2D}
         */
        private canvasContext : CanvasRenderingContext2D;

        /**
         * The width of the stage, in pixels. This is set at creation time and cannot change.
         *
         * @type {number} the width of the stage area in pixels
         */
        get pixelWidth () : number
        { return this.width; }

        /**
         * The height of the stage, in pixels. This is set at creation time and cannot change.
         *
         * @type {number} the height of the stage area in pixels
         */
        get pixelHeight () : number
        { return this.height; }

        /**
         * Get the underlying rendering context for the stage.
         *
         * @returns {CanvasRenderingContext2D} the underlying rendering context for the stage
         */
        get context () : CanvasRenderingContext2D
        { return this.canvasContext; }

        /**
         * Get the underlying canvas object for the stage.
         *
         * @returns {HTMLCanvasElement} the underlying canvas element for the stage
         */
        get canvasObject () : HTMLCanvasElement
        { return this.canvas; }

        /**
         * The stage keeps track of the current frame rate that the update loop is being called at, and this
         * returns the most recently calculated value. The value is recalculated once per second so that
         * it is always a near instantaneous read of the current fps and not an average over the life of
         * the game.
         *
         * @returns {Number} the current fps, which is o when the game is stopped orr just started
         */
        get fps () : number
        { return Stage.fps; }

        /**
         * Determine what scene is the current scene on this stage.
         *
         * @returns {Scene}
         */
        get currentScene () : Scene
        { return Stage.currentScene; }

        /**
         * The currently active scene on the stage. This is the scene that gets all of the user input and
         * the one that the stage reflects all update and render calls to during the game loop.
         *
         * @type {Scene}
         */
        private static currentScene : Scene = new Scene ("defaultScene", null);

        /**
         * The scene that should become active next (if any). When a scene change request happens, the
         * scene to be switched to is stored in this value to ensure that the switch happens at the end of
         * the current update cycle, which happens asynchronously.
         *
         * The value here is null when there is no scene change scheduled.
         *
         * @type {Scene|null}
         */
        private static nextScene : Scene = null;

        /**
         * A list of all of the registered scenes in the stage. The keys are a symbolic string name and
         * the values are the actual Scene instance objects that the names represent.
         *
         * @type {{}}
         */
        private static sceneList : Object = {};

        /**
         * When the engine is running, this is the timer ID of the system timer that keeps the game loop
         * running. Otherwise, this is null.
         *
         * @type {number|null}
         */
        private static gameTimerID : number = null;

        /**
         * The FPS that the engine is currently running at. This is recalculated once per second so that
         * slow update times don't get averaged out over a longer run, which makes the number less useful.
         *
         * @type {number}
         */
        private static fps : number = 0;

        /**
         * When calculating FPS, this is the time that the most recent frame count started. Once we have
         * counted frames for an entire second, this is reset and the count starts again.
         *
         * @type {number}
         */
        private static startTime : number = 0;

        /**
         * When calculating FPS, this is the number of frames that we have seen over the last second. When
         * the startTime gets reset, so does this. This makes sure that spontaneous frame speed changes
         * (e.g. a scene bogging down) don't get averaged away.
         *
         * @type {number}
         */
        private static frameNumber : number = 0;

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
        constructor (containerDivID : string, initialColor : string = 'black')
        {
            // Obtain the container element that we want to insert the canvas into.
            var container = document.getElementById (containerDivID);
            if (container == null)
                throw new ReferenceError ("Unable to create stage: No such element with ID '" + containerDivID + "'");

            // Create the canvas and give it the appropriate dimensions.
            this.canvas = document.createElement ("canvas");
            this.canvas.width = this.width;
            this.canvas.height = this.height;

            // Modify the style of the container div to make it center horizontally.
            container.style.width = this.width + "px";
            container.style.height = this.height + "px";
            container.style.marginLeft = "auto";
            container.style.marginRight = "auto";

            // Get the context for the canvas and then clear it.
            this.canvasContext = this.canvas.getContext ('2d');
            this.clear (initialColor);

            // Append the canvas to the container
            container.appendChild (this.canvas);
        }

        /**
         * This function gets executed in a loop to run the game. Each execution will cause an update and
         * render to be issued to the current scene.
         *
         * In practice, this gets invoked on a timer at the desired FPS that the game should run at.
         */
        private static sceneLoop ()
        {
            // Get the current time for this frame and the elapsed time since we started.
            var currentTime = new Date ().getTime();
            var elapsedTime = (currentTime - Stage.startTime) / 1000;

            // This counts as a frame.
            Stage.frameNumber++;

            // Calculate the FPS now
            Stage.fps = Stage.frameNumber / elapsedTime;

            // If a second or more has elapsed, reset the count. We don't want an average over time, we want
            // the most recent numbers so that we can see momentary drops.
            if (elapsedTime > 1)
            {
                Stage.startTime = new Date ().getTime ();
                Stage.frameNumber = 0;
            }

            try
            {
                // If there is a scene change scheduled, change it now.
                if (Stage.nextScene != null && Stage.nextScene !== Stage.currentScene)
                {
                    // Tell the current scene that it is deactivating and what scene is coming next.
                    Stage.currentScene.deactivating (Stage.nextScene);

                    // Save the current scene, then swap to the new one
                    var previousScene = Stage.currentScene;
                    Stage.currentScene = Stage.nextScene;

                    // Now tell the current scene that it is activating, telling it what scene used to be in
                    // effect.
                    Stage.currentScene.activating (previousScene);

                    // Clear the flag now.
                    Stage.nextScene = null;
                }

                // Do the frame update now
                Stage.currentScene.update ();
                Stage.currentScene.render ();
            }
            catch (error)
            {
                console.log ("Caught exception in sceneLoop(), stopping the game");
                clearInterval (Stage.gameTimerID);
                Stage.gameTimerID = null;
                throw error;
            }
        }

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
        run (fps : number = 30)
        {
            if (Stage.gameTimerID != null)
                throw new Error ("Attempt to start the game running when it is already running");

            // Reset the variables we use for frame counts.
            Stage.startTime = 0;
            Stage.frameNumber = 0;

            // Fire off a timer to invoke our scene loop using an appropriate interval.
            Stage.gameTimerID = setInterval (Stage.sceneLoop, 1000 / fps);

            // Turn on input events.
            Stage.enableInputEvents (this.canvas);
        }

        /**
         * Stop a running game. This halts the update loop but otherwise has no effect. Thus after this call,
         * the game just stops where it was.
         *
         * It is legal to start the game running again via another call to run(), so long as your scenes are
         * not time sensitive.
         *
         * @see Stage.run
         */
        stop ()
        {
            // Make sure the game is running.
            if (Stage.gameTimerID == null)
                throw new Error ("Attempt to stop the game when it is not running");

            // Stop it.
            clearInterval (Stage.gameTimerID);
            Stage.gameTimerID = null;

            // Turn off input events.
            Stage.disableInputEvents (this.canvas);
        }

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
        addScene (name : string, newScene : Scene = null)
        {
            // If this name is in use and we were given a scene object, we should complain.
            if (Stage.sceneList[name] != null && newScene != null)
                console.log ("Warning: overwriting scene registration for scene named " + name);

            // Save the scene
            Stage.sceneList[name] = newScene;
        }

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
        switchToScene (sceneName : string = null)
        {
            // Get the actual new scene, which might be null if the scene named passed in is null.
            var newScene = sceneName != null ? Stage.sceneList[sceneName] : null;

            // If we were given a scene name and there was no such scene, complain before we leave.
            if (sceneName != null && newScene == null)
            {
                console.log ("Attempt to switch to unknown scene named " + sceneName);
                return;
            }

            Stage.nextScene = newScene;
        }

        /**
         * Clear the entire stage with the provided color.
         *
         * @param color the color to clear the stage with.
         */
        clear (color : string = 'black')
        {
            this.canvasContext.fillStyle = color;
            this.canvasContext.fillRect (0, 0, this.width, this.height);
        }

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
        fillRect (x : number, y : number, width : number, height : number, color : string)
        {
            this.canvasContext.fillStyle = color;
            this.canvasContext.fillRect (x, y, width, height);
        }

        /**
         * Render a filled circle with its center at the position provided.
         *
         * @param x X location of the center of the circle
         * @param y Y location of the center of the circle
         * @param radius radius of the circle to draw
         * @param color the color to fill the circle with
         */
        fillCircle (x : number, y : number, radius : number, color : string)
        {
            this.canvasContext.fillStyle = color;
            this.canvasContext.beginPath ();
            this.canvasContext.arc (x, y, radius, 0, Math.PI * 2, true);
            this.canvasContext.fill ();
        }

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
         * @see Stage.setArrowStyle
         */
        setLineStyle (color : string, lineWidth : number = 3, lineCap : string = "round")
        {
            this.canvasContext.strokeStyle = color;
            this.canvasContext.lineWidth = lineWidth;
            this.canvasContext.lineCap = lineCap;
        }

        // TODO This can use an enum for the style now, to make code look nicer
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
        private drawHead (x0 : number, y0 : number, x1 : number, y1 : number, x2 : number, y2 : number,
                          style : number)
        {
            var backDistance;

            // First, the common drawing operations. Generate a line from the left of the arrow head to the
            // point of the arrow and then down the other side.
            this.canvasContext.save ();
            this.canvasContext.beginPath ();
            this.canvasContext.moveTo (x0, y0);
            this.canvasContext.lineTo (x1, y1);
            this.canvasContext.lineTo (x2, y2);

            // Now use the style to finish the arrow head.
            switch (style)
            {
                // The arrow head has a curved line that connects the two sides together.
                case 0:
                    backDistance = Math.sqrt (((x2 - x0) * (x2 - x0)) + ((y2 - y0) * (y2 - y0)));
                    this.canvasContext.arcTo (x1, y1, x0, y0, .55 * backDistance);
                    this.canvasContext.fill ();
                    break;

                // The arrow head has a straight line that connects the two sides together.
                case 1:
                    this.canvasContext.beginPath ();
                    this.canvasContext.moveTo (x0, y0);
                    this.canvasContext.lineTo (x1, y1);
                    this.canvasContext.lineTo (x2, y2);
                    this.canvasContext.lineTo (x0, y0);
                    this.canvasContext.fill ();
                    break;

                // The arrow head is unfilled, so we're already done.
                case 2:
                    this.canvasContext.stroke ();
                    break;

                // The arrow head has a curved line, but the arc is a quadratic curve instead of just a
                // simple arc.
                case 3:
                    var cpx = (x0 + x1 + x2) / 3;
                    var cpy = (y0 + y1 + y2) / 3;
                    this.canvasContext.quadraticCurveTo (cpx, cpy, x0, y0);
                    this.canvasContext.fill ();
                    break;

                // The arrow has a curved line, but the arc is a bezier curve instead of just a simple arc.
                case 4:
                    var cp1x, cp1y, cp2x, cp2y;
                    var shiftAmt = 5;
                    if (x2 == x0)
                    {
                        // Avoid a divide by zero if x2==x0
                        backDistance = y2 - y0;
                        cp1x = (x1 + x0) / 2;
                        cp2x = (x1 + x0) / 2;
                        cp1y = y1 + backDistance / shiftAmt;
                        cp2y = y1 - backDistance / shiftAmt;
                    }
                    else
                    {
                        backDistance = Math.sqrt (((x2 - x0) * (x2 - x0)) + ((y2 - y0) * (y2 - y0)));
                        var xBack = (x0 + x2) / 2;
                        var yBack = (y0 + y2) / 2;
                        var xMid = (xBack + x1) / 2;
                        var yMid = (yBack + y1) / 2;

                        var m = (y2 - y0) / (x2 - x0);
                        var dX = (backDistance / (2 * Math.sqrt (m * m + 1))) / shiftAmt;
                        var dY = m * dX;
                        cp1x = xMid - dX;
                        cp1y = yMid - dY;
                        cp2x = xMid + dX;
                        cp2y = yMid + dY;
                    }

                    this.canvasContext.bezierCurveTo (cp1x, cp1y, cp2x, cp2y, x0, y0);
                    this.canvasContext.fill ();
                    break;
            }
            this.canvasContext.restore ();
        }

        /**
         * Set the style for all subsequent drawArrow() calls to use when drawing arrows. This needs to be
         * called prior to drawing any arrows to ensure that the canvas style used to draw arrows is updated;
         * the value does not persist. In particular, changing line styles will also change this.
         *
         * @param color the color to draw an arrow with
         * @param lineWidth the width of the arrow line
         * @see Stage.setLineStyle
         */
        setArrowStyle (color : string, lineWidth : number = 2)
        {
            this.canvasContext.strokeStyle = color;
            this.canvasContext.fillStyle = color;
            this.canvasContext.lineWidth = lineWidth;
        }

        // TODO this can use Enums for the style and also the which
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
         * @see Stage.setArrowStyle
         */
        drawArrow (x1 : number, y1 : number, x2 : number, y2 : number,
                   style : number = 3, which : number = 1,
                   angle : number = Math.PI / 8, d : number = 16)
        {
            // For ends with arrow we actually want to stop before we get to the arrow so that wide lines
            // won't put a flat end on the arrow caused by the rendered line end cap.
            var dist = Math.sqrt ((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
            var ratio = (dist - d / 3) / dist;
            var toX, toY, fromX, fromY;

            // When the first bit is set, the end point of the line gets an arrow.
            if ((which & 1) != 0)
            {
                toX = Math.round (x1 + (x2 - x1) * ratio);
                toY = Math.round (y1 + (y2 - y1) * ratio);
            }
            else
            {
                toX = x2;
                toY = y2;
            }

            // When the second bit is set, the start point of the line gets an arrow.
            if ((which & 2) != 0)
            {
                fromX = x1 + (x2 - x1) * (1 - ratio);
                fromY = y1 + (y2 - y1) * (1 - ratio);
            }
            else
            {
                fromX = x1;
                fromY = y1;
            }

            // Draw the shaft of the arrow
            this.canvasContext.beginPath ();
            this.canvasContext.moveTo (fromX, fromY);
            this.canvasContext.lineTo (toX, toY);
            this.canvasContext.stroke ();

            // Calculate the angle that the line is going so that we can align the arrow head properly.
            var lineAngle = Math.atan2 (y2 - y1, x2 - x1);

            // Calculate the line length of the side of the arrow head. We know the length if the line was
            // straight, so we need to have its length when it's rotated to the angle that it is to be drawn
            // at. h is the line length of a side of the arrow head
            var h = Math.abs (d / Math.cos (angle));

            var angle1, angle2, topX, topY, botX, botY;

            // When the first bit is set, we want to draw an arrow head at the end of the line.
            if ((which & 1) != 0)
            {
                angle1 = lineAngle + Math.PI + angle;
                topX = x2 + Math.cos (angle1) * h;
                topY = y2 + Math.sin (angle1) * h;
                angle2 = lineAngle + Math.PI - angle;
                botX = x2 + Math.cos (angle2) * h;
                botY = y2 + Math.sin (angle2) * h;
                this.drawHead (topX, topY, x2, y2, botX, botY, style);
            }

            // WHen the second bit is set, we want to draw an arrow head at the start of the line.
            if ((which & 2) != 0)
            {
                angle1 = lineAngle + angle;
                topX = x1 + Math.cos (angle1) * h;
                topY = y1 + Math.sin (angle1) * h;
                angle2 = lineAngle - angle;
                botX = x1 + Math.cos (angle2) * h;
                botY = y1 + Math.sin (angle2) * h;
                this.drawHead (topX, topY, x1, y1, botX, botY, style);
            }
        }

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
        drawTxt (text : string, x : number, y : number, color : string)
        {
            this.canvasContext.fillStyle = color;
            this.canvasContext.fillText (text, x, y);
        }

        /**
         * Displays a bitmap to the stage such that its upper left corner is at the point provided.
         *
         * @param bitmap the bitmap to display
         * @param x X location to display the bitmap at
         * @param y Y location to display the bitmap at
         * @see Stage.drawBmpCentered
         * @see Stage.drawBmpCenteredRotated
         */
        drawBmp (bitmap : HTMLImageElement, x : number, y : number)
        {
            this.canvasContext.drawImage (bitmap, x, y);
        }

        // TODO this and the methods below should use our internal method for translation and/or rotation
        /**
         * Displays a bitmap to the stage such that its center is at the point provided.
         *
         * @param bitmap the bitmap to display
         * @param x X location to display the center of the bitmap at
         * @param y Y location to display the center of the bitmap at
         * @see Stage.drawBmp
         * @see Stage.drawBmpCenteredRotated
         */
        drawBmpCentered (bitmap : HTMLImageElement, x : number, y : number)
        {
            this.canvasContext.save ();
            this.canvasContext.translate (x, y);
            this.canvasContext.drawImage (bitmap, -(bitmap.width / 2), -(bitmap.height / 2));
            this.canvasContext.restore ();
        }

        // TODO this should take the angle in degrees, or have a duplicate that takes them
        /**
         * Display a bitmap to the stage such that its center is at the point provided. The bitmap is also
         * rotated according to the rotation value, which is an angle in radians.
         *
         * @param bitmap the bitmap to display
         * @param x X location to display the center of the bitmap at
         * @param y Y location to display the center of the bitmap at
         * @param angle the angle to rotate the bitmap to (in radians)
         * @see Stage.drawBmp
         * @see Stage.drawBmpCentered
         */
        drawBmpCenteredRotated (bitmap : HTMLImageElement, x : number, y : number, angle : number)
        {
            this.canvasContext.save ();
            this.canvasContext.translate (x, y);
            this.canvasContext.rotate (angle);
            this.canvasContext.drawImage (bitmap, -(bitmap.width / 2), -(bitmap.height / 2));
            this.canvasContext.restore ();

        }

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
         * @param angle the angle to rotate the canvas, in degreesm or null for no translation
         * @see Stage.restore
         */
        translateAndRotate (x : number = null, y : number = null, angle : number = null)
        {
            // First, save the canvas context.
            this.canvasContext.save ();

            // If we are translating, translate now.
            if (x != null && y != null)
                this.canvasContext.translate (x, y);

            // If we are rotating, rotate now.
            if (angle != null)
                this.canvasContext.rotate (angle * (Math.PI / 180));
        }

        /**
         * Restore the canvas state that was in effect the last time that translateAndRotate was invoked. This
         * needs to be invoked the same number of times as that function was invoked because the canvas state
         * is stored on a stack.
         *
         * @see Stage.translateAndRotate
         */
        restore ()
        {
            this.canvasContext.restore ();
        }

        /**
         * Given an event that represents a mouse event for the stage, calculate the position that the mouse
         * is actually at relative to the top left of the stage. This is needed because the position of mouse
         * events is normally relative to the document itself, which may be larger than the actual window.
         *
         * @param mouseEvent the mouse movement or click event
         * @returns {Point} the point of the mouse click/pointer position on the stage
         */
        calculateMousePos (mouseEvent : MouseEvent) : Point
        {
            // Some math has to be done because the mouse position is relative to document, which may have
            // dimensions larger than the current viewable area of the browser window.
            //
            // As a result, we need to ensure that we take into account the position of the canvas in the
            // document AND the scroll position of the document.
            var rect = this.canvas.getBoundingClientRect ();
            var root = document.documentElement;
            var mouseX = mouseEvent.clientX - rect.left - root.scrollLeft;
            var mouseY = mouseEvent.clientY - rect.top - root.scrollTop;

            return new Point (mouseX, mouseY);
        }

        /**
         * Handler for key down events. This gets triggered whenever the game is running and any key is
         * pressed.
         *
         * @param evt the event object for this event
         */
        static keyDownEvent (evt : Event)
        {
            if (Stage.currentScene.inputKeyDown (evt))
                evt.preventDefault ();
        }

        /**
         * Handler for key up events. This gets triggered whenever the game is running and any key is
         * released.
         *
         * @param evt the event object for this event
         */
        static keyUpEvent (evt : Event)
        {
            if (Stage.currentScene.inputKeyUp (evt))
                evt.preventDefault ();
        }

        /**
         * Handler for mouse movement events. This gets triggered whenever the game is running and the mouse
         * moves over the stage.
         *
         * @param evt the event object for this event
         */
        static mouseMoveEvent (evt : Event)
        {
            Stage.currentScene.inputMouseMove (evt);
        }

        /**
         * Handler for mouse movement events. This gets triggered whenever the game is running and the mouse is
         * clicked over the canvas.
         *
         * @param evt the event object for this event
         */
        static mouseClickEvent (evt : Event)
        {
            Stage.currentScene.inputMouseClick (evt);
        }

        /**
         * Turn on input handling for the game. This will capture keyboard events from the document and mouse
         * events for the canvas provided.
         *
         * @param canvas the canvas to listen for mouse events on.
         */
        static enableInputEvents (canvas : HTMLCanvasElement)
        {
            // Mouse events are specific to the canvas.
            canvas.addEventListener ('mousemove', Stage.mouseMoveEvent);
            canvas.addEventListener ('mousedown', Stage.mouseClickEvent);

            // Keyboard events are document wide because a canvas can't hold the input focus.
            document.addEventListener ('keydown', Stage.keyDownEvent);
            document.addEventListener ('keyup', Stage.keyUpEvent);
        }

        /**
         * Turn off input handling for the game. This will turn off keyboard events from the document and
         * mouse events for the canvas provided.
         */
        static disableInputEvents (canvas : HTMLCanvasElement)
        {
            canvas.removeEventListener ('mousemove', Stage.mouseMoveEvent);
            canvas.removeEventListener ('mousedown', Stage.mouseClickEvent);
            document.removeEventListener ('keydown', Stage.keyDownEvent);
            document.removeEventListener ('keyup', Stage.keyUpEvent);
        }

        /**
         * Return a string representation of the object, for debugging purposes.
         *
         * @returns {String} a debug string representation
         */
        toString () : string
        {
            return `[Stage dimensions=${this.width}x${this.height} tileSize=${TILE_SIZE}]`;
        }

    }
}