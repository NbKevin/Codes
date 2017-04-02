/**
 * Created by Nb on 2016/12/7.
 * This script is for the project Codes, test page.
 */


// resources
var Res = {
    /**
     * Capitalise the first letter in a string.
     * @param string {String} The source string.
     * @returns {String}
     */
    capitaliseFirstLetter: function (string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    },

    MonoSpaceFont: null,
    SerifFont: null,
    BaseCanvas: null,
    CodeBufferIdentifier: null,
    CodeBuffer: null,
    Wiki: null,
    BufferPath: '/static/buffer/',
    ResourcePath: '/static/resources/',
    WikiPath: '/static/wiki/',

    /**
     * Join the path.
     * @param basePath Base path.
     * @param fileName Target file name.
     * @returns {String} The full path.
     */
    joinPath: function (basePath, fileName) {
        return basePath + fileName;
    },

    Size: {
        LargerFontSize: 17,
        SmallerFontSize: 12,
        TremendousFontSize: 20
    },

    Colours: {
        MatrixGreen: null,
        MatrixGradient: null
    },

    Metrics: {
        TitleHeightTotal: null,
        TitleHeightSingleLine: null,
        ControlBarHeightTotal: null,
        ControlBarHeightSingleLine: null,
        EditAreaHeight: null,
        ContentWidth: null,
        EditAreaMaxLines: null,
        SecondAreaMaxLines: null
    },

    Moments: {
        LastTimeCursorFlashed: Date.now(),
        LastTimeEditAreaScrolled: Date.now(),
        LastTimeSecondEditAreaScrolled: Date.now()
    },

    Intervals: {
        EditAreaScrollInterval: 150,
        FlashCursorInterval: 850,
        SecondEditAreaScrollInterval: 250
    },

    Pointers: {
        CodeBufferIndexPointer: 0,
        WikiIndexPointer: 10
    },

    SubCanvases: {
        TitleCanvas: null,
        MenuCanvas: null,
        EditAreaCanvas: null,
        SecondEditAreaCanvas: null
    },

    ShouldDrawCursor: false,

    /**
     * Setup necessary metrics.
     * @param canvasWidth BaseCanvas width.
     * @param canvasHeight BaseCanvas height.
     * @returns {Res.Metrics}
     */
    calculateMetrics: function (canvasWidth, canvasHeight) {
        var metrics = this.Metrics;
        metrics.ControlBarHeightSingleLine = this.Size.LargerFontSize;
        metrics.ControlBarHeightTotal = this.Size.LargerFontSize * 3;
        metrics.TitleHeightSingleLine = this.Size.LargerFontSize;
        metrics.TitleHeightTotal = this.Size.LargerFontSize * 3;
        metrics.EditAreaHeight = canvasHeight - this.Size.LargerFontSize * 6;
        metrics.ContentWidth = canvasWidth;
        metrics.EditAreaMaxLines = parseInt((metrics.EditAreaHeight /
            ( this.Size.LargerFontSize * 1.25 )) * 0.85);
        metrics.SecondAreaMaxLines = parseInt((metrics.EditAreaHeight /
        (this.Size.TremendousFontSize * 1.5)));
        return metrics;
    },

    /**
     *
     * Prepare canvases.
     */
    prepareCanvases: function () {
        this.SubCanvases.TitleCanvas = createGraphics(
            this.Metrics.ContentWidth, this.Metrics.TitleHeightTotal);
        this.SubCanvases.TitleCanvas.pixelDensity(1);
        this.SubCanvases.MenuCanvas = createGraphics(
            this.Metrics.ContentWidth, this.Metrics.ControlBarHeightTotal);
        this.SubCanvases.TitleCanvas.pixelDensity(1);
        this.SubCanvases.EditAreaCanvas = createGraphics(
            this.Metrics.ContentWidth, this.Metrics.EditAreaHeight);
        this.SubCanvases.TitleCanvas.pixelDensity(1);
        this.SubCanvases.SecondEditAreaCanvas = createGraphics(
            this.Metrics.ContentWidth / 3, this.Metrics.EditAreaHeight);
        this.SubCanvases.SecondEditAreaCanvas.pixelDensity(1);
    },

    /**
     * Setup colours.
     */
    setupColours: function () {
        this.Colours.MatrixGreen = color(30, 197, 3);
        this.Colours.MatrixGradient = color(16, 14, 15);
    },

    /**
     * Log some message.
     * @param message The message.
     */
    log: function (message) {
        console.log('Codes | ' + message);
    },

    readNextWikiSentence: function () {
        Res.Pointers.WikiIndexPointer++;
        if (Res.Pointers.WikiIndexPointer >= Res.Wiki.length - Res.Metrics.SecondAreaMaxLines)
            Res.Pointers.WikiIndexPointer = 10;
        var nextSentence = new SpeechSynthesisUtterance(Res.Wiki[Res.Pointers.WikiIndexPointer + 9]);
        // rate and pitch settings of the synthesised voice here
        // provided by Google's WebSpeech API
        // also a client can only initiate 100 requests per second
        // therefore the rate must be decreased a bit to avoid this
        nextSentence.rate = .8;
        nextSentence.pitch = .4;
        nextSentence.onend = Res.readNextWikiSentence;
        nextSentence.voice = Res.TTSEngineInUse;
        window.speechSynthesis.speak(nextSentence);
    },

    TTSEnginesReady: false,
    TTSEngineInUse: null,
    SuggestedTTSEngineNumber: null
};


/**
 * Preload procedure.
 */
function preload() {
    // setup font
    Res.log('Loading fonts...');
    Res.MonoSpaceFont = loadFont(Res.joinPath(Res.ResourcePath, 'Menlo-Regular.ttf'));
    Res.SerifFont = loadFont(Res.joinPath(Res.ResourcePath, 'GB2312.ttf'));
    textFont(Res.MonoSpaceFont);
    Res.log('Fonts properly loaded');

    // load code buffer
    // the code buffer is identified by the last section of the url
    Res.log('Determining code buffer identifier...');
    var currentAddress = window.location.href;
    var codeBufferIdentifier = currentAddress.split('/').pop();
    Res.CodeBufferIdentifier = Res.capitaliseFirstLetter(codeBufferIdentifier);
    Res.log('Found code buffer identifier <' + codeBufferIdentifier + '>');
    var codeBufferFileName = Res.BufferPath +
        Res.capitaliseFirstLetter(codeBufferIdentifier) + '_integrated._code';

    // load buffer, note that this operation is asynchronous and therefore
    // we perform a check callback after the operation is done to determine
    // whether it succeeded or not
    Res.log('Attempting to load code buffer by name of <' + codeBufferFileName + '>...');
    Res.CodeBuffer = loadStrings(codeBufferFileName, function () {
        // check load result
        if (Res.CodeBuffer.length === 0) {
            Res.log('Code buffer probably not loaded properly, be careful');
        }
        else {
            Res.log('Loaded code buffer for <' + codeBufferIdentifier + '>, '
                + Res.CodeBuffer.length + ' lines');
        }
    });

    // similarly, load wiki
    var wikiFileName = Res.WikiPath + Res.capitaliseFirstLetter(codeBufferIdentifier) + '_wiki';
    Res.log('Attempting to load wiki by name of <' + wikiFileName + '>...');
    Res.Wiki = loadStrings(wikiFileName, function () {
        // check load result
        if (Res.CodeBuffer.length == 0) {
            Res.log('Wiki probably not loaded properly, be careful');
        }
        else {
            Res.log('Loaded wiki for <' + codeBufferIdentifier + '>, '
                + Res.Wiki.length + ' lines');
            Res.SuggestedTTSEngineNumber = parseInt(Res.Wiki[0]);
            Res.log('Suggested TTS engine is ' + Res.SuggestedTTSEngineNumber);
        }
    })
}


/**
 * Setup procedure.
 */
function setup() {
    Res.BaseCanvas = createCanvas(window.innerWidth, window.innerHeight);
    Res.calculateMetrics(window.innerWidth, window.innerHeight);
    Res.prepareCanvases();
    Res.setupColours();

    // draw the title canvas
    // it seems that graphics in p5 does not require an explicit call to begin drawing
    // Res.SubCanvases.MenuCanvas.beginDraw ();
    var titleCanvas = Res.SubCanvases.TitleCanvas;
    titleCanvas.noStroke();
    titleCanvas.background(0);
    titleCanvas.textFont(Res.MonoSpaceFont);
    titleCanvas.textSize(Res.Size.LargerFontSize);
    titleCanvas.fill(Res.Colours.MatrixGreen);
    titleCanvas.textAlign(CENTER, CENTER);
    titleCanvas.text("GNU Nano: " + Res.CodeBufferIdentifier, Res.Metrics.ContentWidth / 2, 12.5);
    image(titleCanvas, 0, 0);

    // similarly, draw the menu bar
    var menuCanvas = Res.SubCanvases.MenuCanvas;
    menuCanvas.noStroke();
    menuCanvas.background(0);
    menuCanvas.textSize(Res.Size.LargerFontSize);
    menuCanvas.fill(Res.Colours.MatrixGreen);
    menuCanvas.textAlign(LEFT, CENTER);
    menuCanvas.textFont(Res.MonoSpaceFont);
    menuCanvas.text("WriteOut (^O);", 10, 15);
    menuCanvas.text("Exit     (^X);", 10 + Res.Metrics.ContentWidth / 4, 12);
    menuCanvas.text("OpenFile (^E);", 10 + Res.Metrics.ContentWidth / 4 * 2, 12);
    menuCanvas.text("Search   (^S);", 10 + Res.Metrics.ContentWidth / 4 * 3, 12);
    menuCanvas.text("Replace  (^R);", 10, 30);
    menuCanvas.text("Discard  (^D);", 10 + Res.Metrics.ContentWidth / 4, 28);
    menuCanvas.text("MoveDown (^>);", 10 + Res.Metrics.ContentWidth / 4 * 2, 28);
    menuCanvas.text("MoveUp   (^<);", 10 + Res.Metrics.ContentWidth / 4 * 3, 28);
    image(menuCanvas, 0, Res.Metrics.TitleHeightTotal + Res.Metrics.EditAreaHeight);

    // again, similarly, prepare the edit area
    var editArea = Res.SubCanvases.EditAreaCanvas;
    editArea.noStroke();
    editArea.background(0);
    editArea.fill(Res.Colours.MatrixGreen);
    editArea.textAlign(LEFT, CENTER);
    editArea.textFont(Res.MonoSpaceFont);
    image(editArea, 0, Res.Metrics.TitleHeightTotal);

    // test tts engine
    window.speechSynthesis.onvoiceschanged = function () {
        if (Res.TTSEnginesReady) return;
        if (window.speechSynthesis === undefined || SpeechSynthesisUtterance === undefined) {
            Res.log('[WARNING] Current browser does not support WebSpeech API, this project will not work as expected!')
        } else {
            // list all available tts engines
            var availableTtsEngines = window.speechSynthesis.getVoices();
            // wait until it is done
            if (availableTtsEngines.length == 0) {
                Res.log('[WARNING] Current browser/platform combination does not offer any available TTS engine, panic!');
            } else {
                Res.log('All available TTS engine on this browser/platform combination:');
                for (var ttsEngineIndex = 0; ttsEngineIndex < availableTtsEngines.length; ttsEngineIndex++) {
                    Res.log(ttsEngineIndex + ') ' + availableTtsEngines[ttsEngineIndex].name +
                        (availableTtsEngines[ttsEngineIndex].default ? ' [DEFAULT]' : ''));
                }
                Res.TTSEnginesReady = true;
                if (Res.SuggestedTTSEngineNumber <= availableTtsEngines.length)
                    Res.TTSEngineInUse = availableTtsEngines[Res.SuggestedTTSEngineNumber];
                else
                    Res.TTSEngineInUse = availableTtsEngines[11];
                Res.log('Using TTS engine [' + Res.TTSEngineInUse.name + ']');

                // no begin the tts engine
                Res.readNextWikiSentence();
            }
        }
    };
    Res.log('Waiting for TTS engines to load...');

    // render it onto screen
    // image ( Res.SubCanvases.MenuCanvas, 0, 0 )
}


/**
 * Main loop.
 */
function draw() {
    if (!Res.TTSEnginesReady) return;
    image(Res.SubCanvases.EditAreaCanvas, 0, Res.Metrics.TitleHeightTotal);
    if (Res.ShouldDrawCursor) {
        fill(Res.Colours.MatrixGreen);
        rect(30, Res.Metrics.TitleHeightTotal + Res.Metrics.EditAreaMaxLines * Res.Size.LargerFontSize * 1.25 + 5,
            2, 20);
    }
    image(Res.SubCanvases.SecondEditAreaCanvas, Res.Metrics.ContentWidth / 3 * 2, Res.Metrics.TitleHeightTotal);

    // also, every time it should flash, flash the cursor
    // and it should be painted directly
    if (Date.now() - Res.Moments.LastTimeCursorFlashed > Res.Intervals.FlashCursorInterval) {
        Res.ShouldDrawCursor = !Res.ShouldDrawCursor;
    }

    // every time an interval of refreshing code buffer is encountered
    // we refresh it
    if (Date.now() - Res.Moments.LastTimeEditAreaScrolled > Res.Intervals.EditAreaScrollInterval) {
        // advance the code buffer pointer
        Res.Pointers.CodeBufferIndexPointer++;
        if (Res.Pointers.CodeBufferIndexPointer >= Res.CodeBuffer.length - Res.Metrics.EditAreaMaxLines) {
            Res.Pointers.CodeBufferIndexPointer = 0;
            Res.log('Code buffer reaches the end, rewound to the beginning');
        }
        var currentYPosition = Res.Size.LargerFontSize / 1.5;
        var editArea = Res.SubCanvases.EditAreaCanvas;
        editArea.background(15);
        editArea.fill(Res.Colours.MatrixGreen);
        editArea.textFont(Res.MonoSpaceFont);
        editArea.textAlign(LEFT, CENTER);
        editArea.textSize(Res.Size.LargerFontSize);
        for (var i = 0; i < Res.Metrics.EditAreaMaxLines; i++) {
            editArea.text(Res.CodeBuffer[Res.Pointers.CodeBufferIndexPointer + i],
                10, currentYPosition);
            currentYPosition += Res.Size.LargerFontSize * 1.25;
        }
        Res.Moments.LastTimeEditAreaScrolled = Date.now();
    }

    // also, scroll the second edit area
    var secondEditArea = Res.SubCanvases.SecondEditAreaCanvas;
    secondEditArea.textFont(Res.MonoSpaceFont);
    secondEditArea.fill(Res.Colours.MatrixGreen);
    secondEditArea.textAlign(LEFT, CENTER);
    secondEditArea.background(0);
    secondEditArea.textSize(Res.Size.TremendousFontSize);
    secondEditArea.textFont(Res.SerifFont);
    var currentYPosition = Res.Size.TremendousFontSize / 2;
    for (var i = 0; i < Res.Metrics.SecondAreaMaxLines; i++) {
        secondEditArea.text(Res.Wiki[Res.Pointers.WikiIndexPointer + i],
            10, currentYPosition);
        currentYPosition += Res.Size.TremendousFontSize * 1.5;
    }
    secondEditArea.rectMode(CENTER);
    secondEditArea.rect(Res.Metrics.ContentWidth / 3 / 2,
        10 * Res.Size.TremendousFontSize * 1.5 - Res.Size.TremendousFontSize / 2 * 1.5,
        Res.Metrics.ContentWidth, Res.Size.TremendousFontSize * 1.5);
    secondEditArea.fill(Res.Colours.MatrixGradient);
    secondEditArea.textFont(Res.SerifFont);
    secondEditArea.text(Res.Wiki[Res.Pointers.WikiIndexPointer + 9],
        10, 10 * Res.Size.TremendousFontSize * 1.5 - Res.Size.TremendousFontSize / 2 * 1.5);
}
