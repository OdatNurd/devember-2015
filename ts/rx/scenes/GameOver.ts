module nurdz.game
{
    /**
     * The font that is used to display the main "Game Over" text.
     *
     * @type {string}
     */
    const MAIN_FONT = "32px Arial, Serif";

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
         * Our menu; this allows the user to determine if they will try the same level again or go back to
         * the title screen.
         */
        private _menu : Menu;

        /**
         * The music that we play as long as our scene is active.
         */
        private _music : Sound;

        /**
         * Get the level that the game is currently at. In this scene, this represents the level that the
         * last game was at before it ended. This is queried by the title screen when we return to it so
         * that it can set the level to be what the player ended at if they quit.
         */
        get level () : number
        {
            // If we have a game scene and it has a level property, then return it.
            if (this._gameScene && this._gameScene["level"] != undefined)
                return this._gameScene["level"];

            // Return 0 by default.
            return 0;
        }

        /**
         * Construct a new scene, giving it a name and a controlling stage.
         *
         * @param stage the stage that controls us.
         */
        constructor (stage : Stage)
        {
            super ("gameOver", stage);

            // Preload all of our resources.
            this._music = stage.preloadMusic ("Mellowtron");

            // Set up our menu
            this._menu = new Menu (stage, "Arial,Serif", 20);
            this._menu.addItem ("Try again", new Point (325, 350));
            this._menu.addItem ("Quit", new Point (325, 390));

            // Make sure it gets render and update requests.
            this.addActor (this._menu);
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
            // Chain to the super so we get debug messages (otherwise not needed) about the scene change
            super.activating (previousScene);

            // Start our music playing.
            this._music.play ();

            // Store the scene that preceeded us
            this._gameScene = <Game> previousScene;
        }

        /**
         * Triggers when we are no longer the active scene.
         *
         * @param nextScene the scene that is going to become active.
         */
        deactivating (nextScene : Scene) : void
        {
            // Let the super do things so we get debug messages.
            super.deactivating (nextScene);

            // Pause our music playback.
            this._music.pause ();
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

            // Get the menu to update
            super.render ();
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
            // If the super handles the key, we're done.
            if (super.inputKeyDown (eventObj))
                return true;

            switch (eventObj.keyCode)
            {
                // The M key mutes/un-mutes the music. Since the stage will toggle the mute state of
                // everything, all we need to do here is give it the opposite of the current state of our
                // music, and then our music and all other music will toggle state appropriately. Magic!
                case KeyCodes.KEY_M:
                    this._stage.muteMusic (!this._music.muted);
                    return true;

                // Previous menu item (wraps around)
                case KeyCodes.KEY_UP:
                    this._menu.selectPrevious ();
                    return true;

                // Next menu item (wraps around)
                case KeyCodes.KEY_DOWN:
                    this._menu.selectNext ();
                    return true;

                // Select menu item; switches to either the title screen or the game screen depending on
                // the item selected.
                case KeyCodes.KEY_ENTER:
                    this._stage.switchToScene (this._menu.selected == 0 ? "game" : "title");
                    return true;
            }

            return false;
        }
    }
}
