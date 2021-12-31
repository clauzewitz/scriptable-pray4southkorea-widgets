// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: yellow; icon-glyph: ribbon;
const VERSION = '1.0.0';

const DEBUG = false;
const log = (args) => {

    if (DEBUG) {
        console.log(args);
    }
};

const ARGUMENTS = {
    widgetTitle: 'Pray for South Korea',
    rememberDay: '2014. 4. 16',
    // desired interval in minutes to refresh the
    // widget. This will only tell IOS that it's
    // ready for a refresh, whether it actually 
    // refreshes is up to IOS
    refreshInterval: 60 //mins
};
Object.freeze(ARGUMENTS);

const MENU_PROPERTY = {
    rowDismiss: true,
    rowHeight: 50,
    subtitleColor: Color.lightGray()
};
Object.freeze(MENU_PROPERTY);

const CommonUtil = {
    isNumber: (value) => {
        let isValid = false;
    
        if (typeof value === 'number') {
            isValid = true;
        } else if (typeof value === 'string') {
            isValid = /^\d{1,}$/.test(value);
        }
    
        return isValid;
    },
    compareVersion: (version1 = '', version2 = '') => {
        version1 = version1.replace(/\.|\s|\r\n|\r|\n/gi, '');
        version2 = version2.replace(/\.|\s|\r\n|\r|\n/gi, '');

        if (!CommonUtil.isNumber(version1) || !CommonUtil.isNumber(version2)) {
            return false;
        }

        return version1 < version2;
    }
};

const Pray4SouthKoreaClient = {
    //----------------------------------------------
    initialize: () => {
        try {
            this.USES_ICLOUD = module.filename.includes('Documents/iCloud~');
            this.fm = this.USES_ICLOUD ? FileManager.iCloud() : FileManager.local();
            this.root = this.fm.joinPath(this.fm.documentsDirectory(), '/cache/pray4southkorea');
            this.resourcePath = this.fm.joinPath(this.root, 'ribbon.png');
            this.fm.createDirectory(this.root, true);
        } catch (e) {
            log(e.message);
        }
    },
    //----------------------------------------------
    getResource: async () => {

        if (!this.fm.fileExists(this.resourcePath)) {
            const req = new Request('https://raw.githubusercontent.com/clauzewitz/scriptable-pray4southkorea-widgets/main/ribbon.png?token=AC6VL3U4AOMIHBA5M6XNL23BZZZVU');
            const resourceImage = await req.loadImage();
            this.fm.writeImage(this.resourcePath, resourceImage);
        }
    },
    clearCache: async () => {
        this.fm.remove(this.root);
    },
    updateModule: async () => {
        try {
            const latestVersion = await new Request('https://raw.githubusercontent.com/clauzewitz/scriptable-pray4southkorea-widgets/main/version').loadString();

            if (CommonUtil.compareVersion(VERSION, latestVersion)) {
                const code = await new Request('https://raw.githubusercontent.com/clauzewitz/scriptable-pray4southkorea-widgets/main/pray4southkorea.js').loadString();
                this.fm.writeString(this.fm.joinPath(this.fm.documentsDirectory(), `${Script.name()}.js`), code);
                await Covid19Client.presentAlert(`Update to version ${latestVersion}\nPlease launch the app again.`);
            } else {
                await Covid19Client.presentAlert(`version ${VERSION} is currently the newest version available.`);
            }
        } catch (e) {
            log(e.message);
        }
    },
    //----------------------------------------------
    presentAlert: async (prompt = '', items = ['OK'], asSheet = false) => {
        try {
            const alert = new Alert();
            alert.message = prompt;
    
            items.forEach(item => {
                alert.addAction(item);
            });
    
            return asSheet ? await alert.presentSheet() : await alert.presentAlert();
        } catch (e) {
            log(e.message);
        }
    }
};

const createWidget = async (data) => {
    const padding = 10;

    const widget = new ListWidget();
    widget.refreshAfterDate = new Date((Date.now() + (1000 * 60 * ARGUMENTS.refreshInterval)));
    widget.setPadding(padding, padding, padding, padding);
    widget.backgroundColor = Color.white();
    
    const titleRow = widget.addStack();
    const titleStack = titleRow.addStack();
    titleStack.layoutHorizontally();
    titleStack.centerAlignContent();
    titleStack.addSpacer();

    addImage(titleStack, this.fm.readImage(this.resourcePath), 80);
    titleStack.addSpacer();
    
    widget.addSpacer();

    addText(widget, '잊지 않겠습니다.', 'center', 15, true);
    addText(widget, `${ARGUMENTS.rememberDay}`, 'center', 15, true);
    addText(widget, `+ ${calcDiffDate(ARGUMENTS.rememberDay)?.toLocaleString()}일`, 'right').textOpacity = 0.7;
    
    return widget;
};

const calcDiffDate = (date) => {
    let dateFormatter = new DateFormatter();
    dateFormatter.dateFormat = 'y. M. d';

    let presentdate = new Date().getTime();
    let targetDate = dateFormatter.date(date || 0).getTime();

    return Math.floor(Math.abs((targetDate - presentdate) / (1000 * 60 * 60 * 24)) ?? 0);
};

const addImage = (container, image, size) => {
    const icon = container.addImage(image);
    icon.imageSize = new Size(size, size);

    return icon;
};

const addText = (container, text, align = 'center', size = 12, isBold = false) => {
    const txt = container.addText(text);
    txt[`${align}AlignText`]();
    txt.font = isBold ? Font.boldSystemFont(size) : Font.systemFont(size);
    txt.textColor = Color.darkGray();
    return txt;
};

const MENU_ROWS = {
    title: {
        isHeader: true,
        title: `${ARGUMENTS.widgetTitle} Widget`,
        subtitle: `version: ${VERSION}`,
        onSelect: undefined
    },
    checkUpdate: {
        isHeader: false,
        title: 'Check for Updates',
        subtitle: 'Check for updates to the latest version.',
        onSelect: async () => {
            Pray4SouthKoreaClient.updateModule();
        }
    },
    preview: {
        isHeader: false,
        title: 'Preview Widget',
        subtitle: 'Provides a preview for testing.',
        onSelect: async () => {
            const widget = await createWidget();
            
            await widget[`presentSmall`]();
        }
    },
    clearCache: {
        isHeader: false,
        title: 'Clear cache',
        subtitle: 'Clear all caches.',
        onSelect: async () => {
            await Pray4SouthKoreaClient.clearCache();
        }
    }
};

Pray4SouthKoreaClient.initialize();
await Pray4SouthKoreaClient.getResource();

if (config.runsInWidget) {
    const widget = await createWidget();
    Script.setWidget(widget);
} else {
    const menu = new UITable();
    menu.showSeparators = true;

    Object.values(MENU_ROWS).forEach((rowInfo) => {
        const row = new UITableRow();
        row.isHeader = rowInfo.isHeader;
        row.dismissOnSelect = MENU_PROPERTY.rowDismiss;
        row.height = MENU_PROPERTY.rowHeight;
        const cell = row.addText(rowInfo.title, rowInfo.subtitle);
        cell.subtitleColor = MENU_PROPERTY.subtitleColor;
        row.onSelect = rowInfo.onSelect;
        menu.addRow(row);
    });

    await menu.present(false);
}

Script.complete();
