module nurdz.game
{
    /**
     * The font that we use to render our text. If you update this, update the size in FONT_SIZE too.
     *
     * @type {string}
     */
    const FONT : string = "32px monospace";

    /**
     * The properties that a bottle can have.
     */
    interface FloatingTextProperties extends EntityProperties
    {
        /**
         * When true, we render and also update our position based on our other properties.
         */
        visible? : boolean;

        /**
         * The speed that the text floats up. The position of the text goes up by this amount for every
         * update that we are visible.
         */
        speed? : number;

        /**
         * The life of the text, in frame ticks. This counts down for every update where we are visible, and
         * once it hits 0, the text becomes invisible.
         */
        life? : number;
    }

    /**
     * An entity that represents simple floating text. It renders centered on its location and slowly
     * rises before vanishing.
     */
    export class FloatingText extends Entity
    {
        /**
         * Redeclare our text properties so that it is of the correct type. This is allowed because the
         * member is protected.
         */
        protected _properties : FloatingTextProperties;
        get properties () : FloatingTextProperties
        { return this._properties; }

        /**
         * The text that we display.
         */
        private _text : string;

        /**
         * Set the text that we display when we render ourselves.
         *
         * @param newText
         */
        set text (newText : string)
        { this._text = newText; }

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
        constructor (stage : Stage, x : number, y : number, text : string)
        {
            super ("Floaty", stage, x, y, 1, 1, 10, {}, <FloatingTextProperties> {
                visible: false,
                life: 30,
                speed: 2
            }, 'magenta');

            // Set our text.
            this._text = text;
        }

        /**
         * Update the state of the text; this will only do something while the text is visible, and after
         * a set time it will make itself invisible.
         *
         * @param stage the stage that owns us
         * @param tick the current game tick
         */
        update (stage : nurdz.game.Stage, tick : number) : void
        {
            // If our life is greater than 0, then decrement it. When it hits 0, we make ourselves invisible.
            if (this._properties.life > 0)
            {
                this._properties.life--;
                if (this._properties.life == 0)
                    this._properties.visible = false;
            }

            // If we're not visible, leave.
            if (this._properties.visible == false)
                return;

            // Shift our position upwards by the speed.
            this._position.translateXY (0, -this._properties.speed);
        }

        /**
         * Render ourselves, if we are currently visible. This renders the text centered horizontally and
         * vertically on the stage at the position given.
         *
         * @param x the X position to render at
         * @param y the Y position to render at
         * @param renderer the renderer to render ourselves with
         */
        render (x : number, y : number, renderer : CanvasRenderer) : void
        {
            // If we're not visible, leave.
            if (this._properties.visible == false)
                return;

            // Translate the origin to the position we want to render to
            renderer.translateAndRotate (x, y);

            // Set the font and indicate that the text should be centered in both directions.
            renderer.context.font = FONT;
            renderer.context.textAlign = "center";
            renderer.context.textBaseline = "middle";

            // Draw the text and restore the context.
            renderer.drawTxt (this._text, 0, 0, 'green');
            renderer.restore ();
        }
    }
}
