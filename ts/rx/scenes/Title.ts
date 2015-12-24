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
     * A simple menu item structure.
     */
    interface MenuItem
    {
        /**
         * The position of this menu item; the text starts at an offset to the right, this specifies where
         * the menu pointer goes.
         */
        position: Point;

        /**
         * The displayed menu text.
         */
        text: string;
    }
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
        private _menu : Array<MenuItem>;

        /**
         * The currently selected menu item.
         */
        private _menuSelection : number;

        /**
         * The menu pointer. We always position it so that it marks what the currently selected menu item is.
         */
        private _pointer : Pointer;

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
            this._menuSelection = 0;
            this._menu = [
                {
                    position: new Point (150, 400),
                    text: "Change Level (left/right arrows)"
                },
                {
                    position: new Point (150, 450),
                    text: "Start Game"
                },

            ];

            // Set up the pointer.
            this._pointer = new Pointer (stage, 0, 0);
            this.updateMenuPointer ();
            this.addActor (this._pointer);

            // default level.
            this._level = 0;
        }

        /**
         * Change the location of the menu pointer to point to the currently selected menu item.
         */
        private updateMenuPointer () : void
        {
            this._pointer.setStagePositionXY (this._menu[this._menuSelection].position.x,
                                              this._menu[this._menuSelection].position.y);
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
         * Render our menu text.
         */
        private renderMenu () : void
        {
            // Save the context and set up our font and font rendering.
            this._renderer.context.save ();
            this._renderer.context.font = MENU_FONT;
            this._renderer.context.textBaseline = "middle";

            // Render all of the text items. We offset them by the width of the pointer that indicates
            // which item is the current item, with a vertical offset that is half of its height. This
            // makes the point on the pointer align with the center of the text.
            for (let i = 0 ; i < this._menu.length ; i++)
            {
                let item = this._menu[i];
                this._renderer.drawTxt (item.text, item.position.x + TILE_SIZE,
                                        item.position.y + (TILE_SIZE / 2), 'white');
            }
            this._renderer.restore ();
        }

        /**
         * Invoked to render us. We clear the screen, show some intro text, and we allow the user to
         * select a starting level.
         */
        render () : void
        {
            // Clear the screen and let the super render our child entities.
            this._renderer.clear ('black');
            super.render ();

            // Render our text.
            this.renderTitle ();
            this.renderInfoText ();
            this.renderMenu ();
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
                    this._menuSelection--;
                    if (this._menuSelection < 0)
                        this._menuSelection = this._menu.length - 1;
                    this.updateMenuPointer ();
                    return true;

                    case KeyCodes.KEY_DOWN:
                        this._menuSelection++;
                        if (this._menuSelection >= this._menu.length)
                            this._menuSelection = 0;
                        this.updateMenuPointer ();
                        return true;

                case KeyCodes.KEY_ENTER:
                    if (this._menuSelection == 1)
                    {
                        // TODO this does not work properly; the game is already set up at this point
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
