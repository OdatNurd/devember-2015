module nurdz.game
{
    /**
     * The font that is used for the title font.
     *
     * @type {string}
     */
    const TITLE_FONT = "96px Arial,Serif";

    /**
     * The font that is used for our informative text.
     *
     * @type {string}
     */
    const INFO_FONT = "32px Arial,Serif";

    /**
     * The font that is used to display our menu text.
     * @type {string}
     */
    const MENU_FONT = "40px Arial,Serif";

    /**
     * This class represents the title screen. It allows the user to select the level that the game will
     * be played at.
     */
    export class TitleScreen extends Scene
    {
        /**
         * As a supreme hack, redefine the property that defines our renderer so that the compiler knows
         * that it is a canvas renderer. This allows us to get at its context so we can do things outside
         * of what the current API allows for without having to noodle with the API more.
         */
        protected _renderer : CanvasRenderer;

        /**
         * The selected level that the user has chosen. This is exposed to other scenes for their read and
         * write pleasures.
         */
        private _level : number;

        /**
         * The list of menu items that we display to the user.
         */
        private _menu : Menu;

        /**
         * The music that we play as long as our scene is active.
         */
        private _music : Sound;

        /**
         * The sound played when the selected level changes.
         */
        private _sndLevelChange : Sound;

        /**
         * Get the level that the game is currently at. In this scene, this represents the level that the
         * next game will be started at. It defaults to 0, gets modified by the user, and after a game it
         * gets set to the last level achieved (although it caps at 20).
         */
        get level () : number
        { return this._level; }

        /**
         * Construct the title screen scene.
         *
         * @param stage the stage that controls us
         */
        constructor (stage : Stage)
        {
            // Let the super do some setup
            super ("titleScreen", stage);

            // Preload all of our resources.
            this._music = stage.preloadMusic ("BitQuest");
            this._sndLevelChange = stage.preloadSound ("menu_select");

            // Set up our menu.
            this._menu = new Menu (stage, "Arial,Serif", 40, stage.preloadSound ("menu_select"));
            this._menu.addItem ("Level: 0", new Point (150, 400));
            this._menu.addItem ("Start Game", new Point (150, 450));

            // Make sure it gets render and update requests.
            this.addActor (this._menu);

            // default level.
            this._level = 0;
        }

        /**
         * This is invoked when we become the active scene. If the scene that came before us has a level
         * property, we use it to set our own level property. This allows us to return to the menu and
         * have the player easily go back to where they started.
         *
         * @param previousScene the scene that used to be active.
         */
        activating (previousScene : Scene) : void
        {
            // Let the super debug log for us
            super.activating (previousScene);

            // Start our music playing.
            this._music.play ();

            // Does the previous scene have a level property?
            if (previousScene["level"] != undefined)
            {
                // Yes, use it to set our level. We cap at 20 as far as allowing the player to start where
                // they left off.
                this._level = previousScene["level"];
                if (this._level > 20)
                    this._level = 20;
                this.updateMenu ();
            }
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
         * This helper updates our menu to show what the currently selected level is.
         */
        private updateMenu () : void
        {
            let item = this._menu.getItem (0);
            if (item)
                item.text = "Level: " + this._level;

            // Play the sound that shows that the menu selection changed.
            this._sndLevelChange.play ();
        }

        /**
         * Render the name of the game to the screen.
         */
        private renderTitle () : void
        {
            this._renderer.translateAndRotate (this._stage.width / 2, 45);

            // Set the font and indicate that the text should be centered in both directions.
            this._renderer.context.font = TITLE_FONT;
            this._renderer.context.textAlign = "center";
            this._renderer.context.textBaseline = "middle";

            // Draw the text and restore the context.
            this._renderer.drawTxt ("Rx", 0, 0, 'white');
            this._renderer.restore ();
        }

        /**
         * Render our info text to the screen.
         */
        private renderInfoText () : void
        {
            // The info text that we generate to the screen to explain what we are.
            const infoText = [
                "A simple Dr. Mario clone",
                "",
                "Coded during #devember 2015 by Terence Martin",
                "as an experiment in TypeScript and #gamedev",
                "",
                "Feel free to use this code as you see fit. See the",
                "LICENSE file for details"
            ];

            // Save the context state and then set our font and vertical font alignment.
            this._renderer.translateAndRotate (TILE_SIZE, 132);
            this._renderer.context.font = INFO_FONT;
            this._renderer.context.textBaseline = "middle";

            // Draw the text now
            for (let i = 0, y = 0 ; i < infoText.length ; i++, y += TILE_SIZE)
                this._renderer.drawTxt (infoText[i], 0, y, '#c8c8c8');

            // We can restore now.
            this._renderer.restore ();
        }

        /**
         * Invoked to render us. We clear the screen, show some intro text, and we allow the user to
         * select a starting level.
         */
        render () : void
        {
            // Clear the screen and render all of our text.
            this._renderer.clear ('black');
            this.renderTitle ();
            this.renderInfoText ();

            // Now let the super draw everything else, including our menu
            super.render ();
        }

        /**
         * Triggers on a key press
         *
         * @param eventObj key event object
         * @returns {boolean} true if we handled the key or false otherwise.
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

                // Previous menu selection (wraps around)
                case KeyCodes.KEY_UP:
                    this._menu.selectPrevious ();
                    return true;

                // Next menu selection (wraps around)
                case KeyCodes.KEY_DOWN:
                    this._menu.selectNext ();
                    return true;

                // Reduce the level (capped at 0 minimum)
                case KeyCodes.KEY_LEFT:
                    if (this._menu.selected == 0)
                    {
                        if (this._level > 0)
                        {
                            this._level--;
                            this.updateMenu ();
                        }
                        return true;
                    }
                    return false;

                // Increase the level (capped at 20 maximum)
                case KeyCodes.KEY_RIGHT:
                    if (this._menu.selected == 0)
                    {
                        if (this._level < 20)
                        {
                            this._level++;
                            this.updateMenu ();
                        }
                        return true;
                    }
                    return false;

                // Select the current menu item; on level increase it, on start game, do that.
                case KeyCodes.KEY_ENTER:
                    if (this._menu.selected == 0)
                    {
                        this._level++;
                        if (this._level > 20)
                            this._level = 0;
                        this.updateMenu ();
                        return true;
                    }
                    else
                    {
                        this._stage.switchToScene ("game");
                        return true;
                    }
                    break;
            }

            // Not handled.
            return false;
        }
    }
}
