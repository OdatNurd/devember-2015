module nurdz.game
{
    /**
     * The font that is used to display the main "Game Over" text.
     *
     * @type {string}
     */
    const MAIN_FONT = "32px Arial, Serif";

    /**
     * The font that is used to display the "press any key" text.
     *
     * @type {string}
     */
    const SUB_FONT = "16px monospace";

    /**
     * This class represents the game over screen. This is just a simple scene that jumps back to another
     * scene after telling you that the game is over.
     *
     * This may be overkill in this particular prototype, but this is a good example of one method of
     * de-cluttering the code by not having 100% of all visual logic in one place.
     */
    export class GameOver extends Scene
    {
        /**
         * As a supreme hack, redefine the property that defines our renderer so that the compiler knows
         * that it is a canvas renderer. This allows us to get at its context so we can do things outside
         * of what the current API allows for without having to noodle with the API more.
         */
        protected _renderer : CanvasRenderer;

        /**
         * The scene that we assume is the game scene. This is really just a reference to the scene that
         * had control before us, which should always be the game scene.
         *
         * We use this to do primary rendering, so that we can just mark up the screen a bit without
         * having to replicate what the game scene is doing.
         */
        private _gameScene : Game;

        /**
         * The index into the color list that indicates what color to use to render our blinking text.
         *
         * @type {number}
         */
        private _colorIndex : number = 0;

        /**
         * The list of colors that we use to display our blinking text.
         *
         * @type {Array<string>}
         */
        private _colors : Array<string> = ['#ffffff', '#aaaaaa'];

        /**
         * Construct a new scene, giving it a name and a controlling stage.
         *
         * @param name the name of this scene for debug purposes
         * @param stage the stage that controls us.
         */
        constructor (name : string, stage : Stage)
        {
            super (name, stage);
        }

        /**
         * This gets triggered when the stage changes from some other scene to our scene. We get told what
         * the previously active scene was. We use this to capture the game scene so that we can get it to
         * render itself.
         *
         * @param previousScene
         */
        activating (previousScene : Scene) : void
        {
            // Chain to the super so we get debug messages (otherwise not needed) about the scene change, then
            // store the scene that game before us.
            super.activating (previousScene);
            this._gameScene = <Game> previousScene;
        }

        /**
         * Perform a frame update for our scene.
         * @param tick the game tick; this is a count of how many times the game loop has executed
         */
        update (tick : number) : void
        {
            // Let the super update our child entities
            super.update (tick);

            // Cycle to the next color if its time.
            if (tick % 5 == 0)
            {
                this._colorIndex++;
                if (this._colorIndex == this._colors.length)
                    this._colorIndex = 0;
            }
        }

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
        private displayText (x : number, y : number, text : string, font : string, color : string)
        {
            // Put the origin at the text position.
            this._renderer.translateAndRotate (x, y);

            // Set the font and indicate that the text should be centered in both directions.
            this._renderer.context.font = font;
            this._renderer.context.textAlign = "center";
            this._renderer.context.textBaseline = "middle";

            // Draw the text and restore the context.
            this._renderer.drawTxt (text, 0, 0, color);
            this._renderer.restore ();
        }

        /**
         * Called to render our scene. We piggyback render on the scene that came before us so that we can
         * display extra stuff on the stage without having to fully replicate everything that the other
         * scene was doing.
         */
        render () : void
        {
            // If we know what the game scene is, then allow it to render first, setting up the stage for us.
            // As a fallback, clear the stage when we don't know how this works.
            if (this._gameScene != null)
                this._gameScene.render ();
            else
                this._renderer.clear ('black');

            // Display our game over and press a key to restart text.
            this.displayText (this._stage.width / 2, this._stage.height / 2, "Game Over", MAIN_FONT, 'white');
            this.displayText (this._stage.width / 2, this._stage.height / 2 + (1.5 * TILE_SIZE),
                              "Press any key", SUB_FONT, this._colors[this._colorIndex]);
        }

        /**
         * Invoked to handle a key press. We use this to tell the stage to switch to the game scene again
         * from our scene.
         *
         * @param eventObj the event that tells us what key was pressed.
         * @returns {boolean} always true
         */
        inputKeyDown (eventObj : KeyboardEvent) : boolean
        {
            // If the other scene responds, tell it to restart the game
            if (this._gameScene.restartGame != null)
                this._gameScene.restartGame ();

            this._stage.switchToScene ("game");
            return true;
        }
    }
}
