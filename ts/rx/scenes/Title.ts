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
         * Get the current level. This is the last set value, which may be what the user selected, or may
         * be a higher value if an external caller has tweaked it.
         *
         * @returns {number}
         */
        get level () : number
        { return this._level; }

        /**
         * Set the passed in level to be the level that the user has set.
         *
         * @param newLevel
         */
        set level (newLevel : number)
        { this._level = newLevel; }

        /**
         * Construct the title screen scene.
         *
         * @param stage the stage that controls us
         */
        constructor (stage : Stage)
        {
            // Let the super do some setup
            super ("titleScreen", stage);

            // Set up our menu.
            this._menu = new Menu (stage, "Arial,Serif", 40);
            this._menu.addItem ("Change Level", new Point (150, 400));
            this._menu.addItem ("Start Game", new Point (150, 450));

            // Make sure it gets render and update requests.
            this.addActor (this._menu);

            // default level.
            this._level = 0;
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
                case KeyCodes.KEY_UP:
                    this._menu.selectPrevious ();
                    return true;

                case KeyCodes.KEY_DOWN:
                    this._menu.selectNext ();
                    return true;

                case KeyCodes.KEY_ENTER:
                    if (this._menu.selected == 1)
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
