
const { Plugin, PluginSettingTab, Setting, Notice, MarkdownView, FuzzySuggestModal, TFile, Modal } = require('obsidian');

const DEFAULT_SETTINGS = {
  palette: [
    { name: 'آبی تیره #002060', value: '#002060' },
    { name: 'آبی #0070C0', value: '#0070C0' },
    { name: 'مشکی black', value: 'black' },
    { name: 'قرمز', value: '#FF0000' },
    { name: 'سبز green', value: 'green' },
  ],
  addHiddenRTL: true,
  hiddenRTLChar: '\u200F',
  createBak: true,
};

class FolderSuggestModal extends FuzzySuggestModal {
  constructor(app, folders, onChoose){
    super(app);
    this.folders = folders;
    this.onChoose = onChoose;
  }
  getItems(){ return ["[ کل والت ]", ...this.folders]; }
  getItemText(item){ return item; }
  onChooseItem(item){ this.onChoose(item); }
}

class SpanMasterModal extends Modal {
  constructor(app, plugin){
    super(app);
    this.plugin = plugin;
    this.activeTab = 'insert';
    this.insFont='none'; this.insColor='#0070C0'; this.insSize='none';
    this.clrFont='none'; this.clrColor='black'; this.clrSize='none'; this.clrCondition='or'; this.clrDeleteContent=false;
    this.srcFont='none'; this.srcFontOp='='; this.srcColor='black'; this.srcColorOp='!'; this.srcSize='none'; this.srcSizeOp='='; this.srcCondition='and';
    this.destFont='Adobe نسخ Medium'; this.destColor='none'; this.destSize='1.4em';
    this.scope='selection'; this.folderPath='';
  }
  onOpen(){ this.build(); }
  build(){
    const {contentEl, titleEl} = this;
    titleEl.setText('Span Master Toolkit');
    contentEl.empty();
    contentEl.addClass('span-master-modal');
    const tabBar = contentEl.createDiv({cls:'span-tabs'});
    const tabs = [['insert','درج اسپن'],['clear','حذف اسپن'],['convert','تبدیل اسپن']];
    tabs.forEach(([id,label])=>{
      const b = tabBar.createEl('button',{text:label});
      b.addClass('span-tab'); if(this.activeTab===id) b.addClass('is-active');
      b.onclick=()=>{ this.activeTab=id; this.build(); };
    });
    const body = contentEl.createDiv({cls:'span-body'});
    if(this.activeTab==='insert') this.buildInsert(body);
    if(this.activeTab==='clear') this.buildClear(body);
    if(this.activeTab==='convert') this.buildConvert(body);
    body.createEl('hr');
    const scopeDiv = body.createDiv();
    scopeDiv.createEl('h4',{text:'محدوده اجرا'});
    new Setting(scopeDiv).setName('اجرا روی').addDropdown(dd=>{
      dd.addOption('selection','متن انتخاب شده (اگر انتخاب نیست → کل فایل)');
      dd.addOption('file','کل فایل فعال');
      dd.addOption('folder','کل پوشه (با بکاپ .bak)');
      dd.setValue(this.scope);
      dd.onChange(v=>{ this.scope=v; this.build(); });
    });
    if(this.scope==='folder'){
      new Setting(scopeDiv).setName('پوشه').setDesc(this.folderPath||'کل والت').addButton(btn=>{
        btn.setButtonText('انتخاب پوشه');
        btn.onClick(()=>{
          const folders = this.plugin.getAllFolders();
          new FolderSuggestModal(this.app, folders, (sel)=>{
            this.folderPath = sel.startsWith('[ کل') ? '' : sel;
            this.build();
          }).open();
        });
      });
    }
    // RTL toggle فقط برای درج و تبدیل - برای حذف همیشه حذف می‌شود (بی‌معنی است)
    if(this.activeTab!=='clear'){
      new Setting(scopeDiv).setName(this.activeTab==='insert' ? 'افزودن کاراکتر مخفی RTL قبل از اسپن' : 'کاراکتر مخفی RTL در تبدیل').setDesc(this.activeTab==='insert' ? 'اگر خاموش باشد، کاراکتر ‏ اضافه نمی‌شود' : 'روشن: RTL قبلی حفظ + اگر نداشت اضافه | خاموش: RTL قبلی هم پاک').addToggle(t=>{
        t.setValue(this.plugin.settings.addHiddenRTL);
        t.onChange(async v=>{ this.plugin.settings.addHiddenRTL=v; await this.plugin.saveSettings(); });
      });
    } else {
      // اطلاع برای حذف
      scopeDiv.createEl('p',{text:'در حالت حذف، کاراکترهای نامرئی \u200c\u200d\u200e\u200f\ufeff قبل از اسپن همیشه حذف می‌شوند (طبق کد اصلی شما).', cls:'setting-item-description'});
    }
    const footer = contentEl.createDiv({cls:'span-footer'});
    const runBtn = footer.createEl('button',{text:'اجرا', cls:'mod-cta'});
    runBtn.onclick=async()=>{ await this.runAction(); };
  }
  buildInsert(c){
    c.createEl('h4',{text:'درج اسپن جدید'});
    c.createEl('p',{text:'منطق: هر خط / پاراگراف جدا اسپن می‌خورد + کاراکتر نامرئی RTL قبلش - برای جلوگیری از یک خط شدن نمایش', cls:'setting-item-description'});
    new Setting(c).setName('فونت (font-family)').setDesc('none = بدون فونت').addText(t=>{ t.setValue(this.insFont); t.onChange(v=>this.insFont=v); t.inputEl.style.width='260px'; });
    const cs = new Setting(c).setName('رنگ (color)');
    let textComp = null;
    let colorComp = null;
    cs.addDropdown(dd=>{
      this.plugin.settings.palette.forEach(p=> dd.addOption(p.value, `${p.name} (${p.value})`));
      dd.addOption('custom','Custom...');
      dd.setValue(this.plugin.settings.palette.find(p=>p.value===this.insColor) ? this.insColor : 'custom');
      dd.onChange(v=>{
        if(v!=='custom'){
          this.insColor=v;
          if(textComp) textComp.setValue(v);
          if(colorComp && v.startsWith('#')){ try{colorComp.setValue(v);}catch(e){} }
        }
      });
    });
    cs.addText(t=>{ textComp=t; t.setValue(this.insColor); t.setPlaceholder('#0070C0 یا black'); t.onChange(v=>{
      this.insColor=v;
      if(colorComp && v.startsWith('#')){ try{colorComp.setValue(v);}catch(e){} }
    }); });
    cs.addColorPicker(cp=>{ colorComp=cp; try{cp.setValue(this.insColor.startsWith('#')?this.insColor:'#0070C0');}catch(e){} cp.onChange(v=>{
      this.insColor=v;
      if(textComp) textComp.setValue(v);
    }); });
    new Setting(c).setName('سایز (font-size)').setDesc('مثلا 1.4em یا 14px - none = بدون سایز').addText(t=>{ t.setValue(this.insSize); t.onChange(v=>this.insSize=v); });
  }
  buildClear(c){
    c.createEl('h4',{text:'حذف اسپن'});
    c.createEl('p',{text:'دقت‌های کد شما: فیلتر شامل (includes) و case-insensitive، حذف \\u200c\\u200d\\u200e\\u200f\\ufeff و فاصله قبل اسپن، حلقه do/while برای تودرتو', cls:'setting-item-description'});
    new Setting(c).setName('فونت هدف').setDesc('none = غیرفعال').addText(t=>{ t.setValue(this.clrFont); t.onChange(v=>this.clrFont=v); });
    new Setting(c).setName('رنگ هدف').setDesc('مثلا black یا #ff0000 - none = غیرفعال').addText(t=>{ t.setValue(this.clrColor); t.onChange(v=>this.clrColor=v); });
    new Setting(c).setName('سایز هدف').setDesc('برای یکسان‌سازی اضافه شد - none = غیرفعال').addText(t=>{ t.setValue(this.clrSize); t.onChange(v=>this.clrSize=v); });
    new Setting(c).setName('شرط ترکیب').addDropdown(dd=>{ dd.addOption('or','or = یکی بخورد کافیست'); dd.addOption('and','and = همه باید بخورند'); dd.setValue(this.clrCondition); dd.onChange(v=>this.clrCondition=v); });
    new Setting(c).setName('محتوای داخل اسپن هم حذف شود؟').setDesc('false = فقط تگ پاک شود و متن بماند (مثل کد اصلی)').addToggle(t=>{ t.setValue(this.clrDeleteContent); t.onChange(v=>this.clrDeleteContent=v); });
  }
  buildConvert(c){
    c.createEl('h4',{text:'مبدا - چی را پیدا کنم'});
    const row=(label,val,op,onVal,onOp)=>{ const s=new Setting(c).setName(label); s.addText(t=>{ t.setValue(val); t.onChange(onVal); }); s.addDropdown(dd=>{ dd.addOption('=','= هست'); dd.addOption('!','! نیست'); dd.setValue(op); dd.onChange(onOp); }); };
    row('فونت مبدا', this.srcFont, this.srcFontOp, v=>this.srcFont=v, v=>this.srcFontOp=v);
    row('رنگ مبدا', this.srcColor, this.srcColorOp, v=>this.srcColor=v, v=>this.srcColorOp=v);
    row('سایز مبدا', this.srcSize, this.srcSizeOp, v=>this.srcSize=v, v=>this.srcSizeOp=v);
    new Setting(c).setName('شرط ترکیب مبدا').addDropdown(dd=>{ dd.addOption('and','and = همه با هم'); dd.addOption('or','or = یکی کافیست'); dd.setValue(this.srcCondition); dd.onChange(v=>this.srcCondition=v); });
    c.createEl('h4',{text:'مقصد - به چی تبدیل کنم'});
    c.createEl('p',{text:'none/keep = دست نزن | remove/delete = حذف کامل آن ویژگی - دقیقا مثل کد اصلی', cls:'setting-item-description'});
    new Setting(c).setName('فونت مقصد').addText(t=>{ t.setValue(this.destFont); t.onChange(v=>this.destFont=v); });
    new Setting(c).setName('رنگ مقصد').addText(t=>{ t.setValue(this.destColor); t.onChange(v=>this.destColor=v); });
    new Setting(c).setName('سایز مقصد').addText(t=>{ t.setValue(this.destSize); t.onChange(v=>this.destSize=v); });
  }
  async runAction(){
    const scope=this.scope;
    if(scope==='selection' || scope==='file'){
      const view=this.app.workspace.getActiveViewOfType(MarkdownView);
      if(!view){ new Notice('فایل فعال نیست'); return; }
      const ed=view.editor;
      const sel=ed.getSelection();
      if(scope==='selection' && sel && sel.length>0){
        ed.replaceSelection(this.processText(sel));
        new Notice('روی انتخاب اجرا شد');
      } else {
        ed.setValue(this.processText(ed.getValue()));
        new Notice('روی کل فایل اجرا شد');
      }
    } else {
      const allFiles=this.app.vault.getMarkdownFiles();
      const targets=this.folderPath==='' ? allFiles : allFiles.filter(f=> f.path===this.folderPath || f.path.startsWith(this.folderPath+'/'));
      let changed=0;
      for(const file of targets){
        const content=await this.app.vault.read(file);
        const cleaned=this.processText(content);
        if(content!==cleaned){
          if(this.plugin.settings.createBak){
            const bakPath=file.path+'.bak';
            const bak=this.app.vault.getAbstractFileByPath(bakPath);
            if(bak instanceof TFile) await this.app.vault.modify(bak, content);
            else await this.app.vault.create(bakPath, content);
          }
          await this.app.vault.modify(file, cleaned);
          changed++;
        }
      }
      new Notice(`تمام شد: ${changed} فایل در ${this.folderPath||'کل والت'}`);
    }
    this.close();
  }
  processText(text){ if(this.activeTab==='insert') return this.insertLogic(text); if(this.activeTab==='clear') return this.clearLogic(text); return this.convertLogic(text); }
  insertLogic(text){
    const font=this.insFont.trim(); const color=this.insColor.trim(); const size=this.insSize.trim();
    const useFont=!['none',''].includes(font.toLowerCase()); const useColor=!['none',''].includes(color.toLowerCase()); const useSize=!['none',''].includes(size.toLowerCase());
    if(!useFont && !useColor && !useSize) return text;
    let parts=[]; if(useFont) parts.push(`font-family: ${font}`); if(useColor) parts.push(`color: ${color}`); if(useSize) parts.push(`font-size: ${size}`);
    const styleStr=parts.join('; ')+';';
    const rtl=this.plugin.settings.addHiddenRTL ? this.plugin.settings.hiddenRTLChar : '';
    // نکته کلیدی که اشاره کردید: هر خط/پاراگراف جدا اسپن بخورد وگرنه کل متن یک خط نمایش داده می‌شود
    // خطوط خالی را حفظ می‌کنیم
    const lines = text.split(/\r?\n/);
    const wrapped = lines.map(line=>{
      if(line.trim()==='') return line;
      // اگر خط از قبل اسپن دارد، دوباره اسپن نزن - نکته‌ای که اشاره کردید
      if(line.toLowerCase().includes('<span')) return line;
      return `${rtl}<span style="${styleStr}">${line}</span>`;
    });
    return wrapped.join('\n');
  }
  clearLogic(text){
    const fFont=this.clrFont.trim().toLowerCase(); const fColor=this.clrColor.trim().toLowerCase(); const fSize=this.clrSize.trim().toLowerCase();
    const useFont=fFont!=='none' && fFont!==''; const useColor=fColor!=='none' && fColor!==''; const useSize=fSize!=='none' && fSize!=='';
    if(!useFont && !useColor && !useSize){ new Notice('همه فیلترها none هستند'); return text; }
    const cond=this.clrCondition;
    const shouldDelete=(openTag)=>{ const t=openTag.toLowerCase(); const hasFont=useFont?t.includes(fFont):false; const hasColor=useColor?t.includes(fColor):false; const hasSize=useSize?t.includes(fSize):false; const checks=[]; if(useFont) checks.push(hasFont); if(useColor) checks.push(hasColor); if(useSize) checks.push(hasSize); if(checks.length===1) return checks[0]; return cond==='and' ? checks.every(Boolean) : checks.some(Boolean); };
    let prev, cur=text; do{ prev=cur; cur=cur.replace(/[\u200c\u200d\u200e\u200f\ufeff]*\s*(<span[^>]*>)([\s\S]*?)<\/span>/gi, (m,openTag,inner)=>{ return shouldDelete(openTag) ? (this.clrDeleteContent ? '' : inner) : m; }); }while(cur!==prev); return cur;
  }
  convertLogic(text){
    const srcFont=this.srcFont.trim().toLowerCase(); const srcColor=this.srcColor.trim().toLowerCase(); const srcSize=this.srcSize.trim().toLowerCase();
    const useSrcFont=srcFont!=='none' && srcFont!==''; const useSrcColor=srcColor!=='none' && srcColor!==''; const useSrcSize=srcSize!=='none' && srcSize!=='';
    if(!useSrcFont && !useSrcColor && !useSrcSize){ new Notice('مبدا هر سه none هست'); return text; }
    const srcFontIsNot=this.srcFontOp==='!'; const srcColorIsNot=this.srcColorOp==='!'; const srcSizeIsNot=this.srcSizeOp==='!'; const srcOp=this.srcCondition;
    const destFontRaw=this.destFont.trim(); const destColorRaw=this.destColor.trim(); const destSizeRaw=this.destSize.trim();
    const dFL=destFontRaw.toLowerCase(); const dCL=destColorRaw.toLowerCase(); const dSL=destSizeRaw.toLowerCase();
    const destFontActive=!['none','keep',''].includes(dFL); const destFontRemove=['remove','delete'].includes(dFL);
    const destColorActive=!['none','keep',''].includes(dCL); const destColorRemove=['remove','delete'].includes(dCL);
    const destSizeActive=!['none','keep',''].includes(dSL); const destSizeRemove=['remove','delete'].includes(dSL);
    const shouldConvert=(openTag)=>{ const t=openTag.toLowerCase(); const res=[]; if(useSrcFont){ const has=t.includes(srcFont); res.push(srcFontIsNot?!has:has); } if(useSrcColor){ const has=t.includes(srcColor); res.push(srcColorIsNot?!has:has); } if(useSrcSize){ const has=t.includes(srcSize); res.push(srcSizeIsNot?!has:has); } return srcOp==='and' ? res.every(Boolean) : res.some(Boolean); };
    const buildNewTag=(openTag)=>{ let newTag=openTag; const styleMatch=openTag.match(/style\s*=\s*(["'])(.*?)\1/i); let styleContent=styleMatch? styleMatch[2] : ''; let newStyle=styleContent; if(destFontActive||destFontRemove) newStyle=newStyle.replace(/font-family\s*:\s*[^;"]+;?/gi,''); if(destColorActive||destColorRemove) newStyle=newStyle.replace(/(^|;)\s*color\s*:\s*[^;"]+;?/gi,';'); if(destSizeActive||destSizeRemove) newStyle=newStyle.replace(/font-size\s*:\s*[^;"]+;?/gi,''); newStyle=newStyle.replace(/;;+/g,';').replace(/^\s*;\s*/,'').trim(); if(destFontActive){ if(newStyle && !newStyle.endsWith(';')) newStyle+='; '; newStyle+=`font-family: ${destFontRaw}`; } if(destColorActive){ if(newStyle && !newStyle.endsWith(';') && newStyle.length>0) newStyle+='; '; else if(newStyle.length>0) newStyle+=' '; newStyle+=`color: ${destColorRaw}`; } if(destSizeActive){ if(newStyle && !newStyle.endsWith(';') && newStyle.length>0) newStyle+='; '; else if(newStyle.length>0) newStyle+=' '; newStyle+=`font-size: ${destSizeRaw}`; } newStyle=newStyle.trim().replace(/^;+/,'').trim(); if(newStyle && !newStyle.endsWith(';')) newStyle+=';'; if(newStyle){ if(styleMatch) newTag=newTag.replace(/style\s*=\s*(["'])(.*?)\1/i, `style="${newStyle}"`); else newTag=newTag.replace(/>$/, ` style="${newStyle}">`); } else { if(styleMatch) newTag=newTag.replace(/\s*style\s*=\s*(["'])(.*?)\1/i,''); } return newTag.replace(/\s+>/,'>'); };
    // منطق جدید RTL برای تبدیل - طبق درخواست شما
    const addRTL = this.plugin.settings.addHiddenRTL;
    const rtlChar = this.plugin.settings.hiddenRTLChar || '\u200F';
    let prev, cur=text;
    do{
      prev=cur;
      if(addRTL){
        // روشن: RTL قبلی حفظ + اگر نداشت اضافه کن
        cur=cur.replace(/([\u200c\u200d\u200e\u200f\ufeff]*\s*)?(<span[^>]*>)([\s\S]*?)<\/span>/gi, (m, leading, openTag, inner)=>{
          if(!shouldConvert(openTag)) return m;
          const newTag = buildNewTag(openTag);
          const hasRTL = leading && /[\u200c\u200d\u200e\u200f\ufeff]/.test(leading);
          if(hasRTL){
            return (leading||'') + newTag + inner + '</span>';
          } else {
            // اگر leading فقط فاصله بود یا اصلا نبود، RTL اضافه کن
            const space = leading ? leading.replace(/[\u200c\u200d\u200e\u200f\ufeff]/g,'') : '';
            return space + rtlChar + newTag + inner + '</span>';
          }
        });
      } else {
        // خاموش: RTL قبلی هم پاک بشه
        cur=cur.replace(/[\u200c\u200d\u200e\u200f\ufeff]*\s*(<span[^>]*>)([\s\S]*?)<\/span>/gi, (m, openTag, inner)=>{
          if(!shouldConvert(openTag)) return m;
          return buildNewTag(openTag) + inner + '</span>';
        });
      }
    }while(cur!==prev);
    return cur;
  }
}

module.exports = class SpanMasterPlugin extends Plugin {
  async onload(){
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    this.addRibbonIcon('paintbrush','Span Master Toolkit', ()=>{ new SpanMasterModal(this.app, this).open(); });
    this.addCommand({id:'open-span-master', name:'باز کردن Span Master Toolkit', callback:()=>{ new SpanMasterModal(this.app, this).open(); }});
    this.addCommand({id:'span-insert-selection', name:'درج اسپن روی انتخاب', editorCallback:(ed)=>{ const m=new SpanMasterModal(this.app,this); m.activeTab='insert'; const sel=ed.getSelection(); if(sel) ed.replaceSelection(m.insertLogic(sel)); }});
    this.addCommand({id:'span-clear-selection', name:'حذف اسپن روی انتخاب', editorCallback:(ed)=>{ const m=new SpanMasterModal(this.app,this); m.activeTab='clear'; const sel=ed.getSelection(); if(sel) ed.replaceSelection(m.clearLogic(sel)); else ed.setValue(m.clearLogic(ed.getValue())); }});
    this.addCommand({id:'span-convert-selection', name:'تبدیل اسپن روی انتخاب', editorCallback:(ed)=>{ const m=new SpanMasterModal(this.app,this); m.activeTab='convert'; const sel=ed.getSelection(); if(sel) ed.replaceSelection(m.convertLogic(sel)); else ed.setValue(m.convertLogic(ed.getValue())); }});
    this.addSettingTab(new (class extends PluginSettingTab {
      constructor(app, plugin){ super(app, plugin); this.plugin=plugin; }
      display(){
        const {containerEl}=this; containerEl.empty();
        containerEl.createEl('h2',{text:'Span Master Toolkit'});
        new Setting(containerEl).setName('کاراکتر مخفی RTL').setDesc('پیش‌فرض U+200F ‏ - نکته اصلی شما').addDropdown(dd=>{
          dd.addOption('\u200F','U+200F RLM ‏'); dd.addOption('\u200E','U+200E LRM ‎'); dd.addOption('\u200C','U+200C ZWNJ ‌'); dd.setValue(this.plugin.settings.hiddenRTLChar); dd.onChange(async v=>{ this.plugin.settings.hiddenRTLChar=v; await this.plugin.saveSettings(); });
        });
        new Setting(containerEl).setName('افزودن خودکار RTL').addToggle(t=>{ t.setValue(this.plugin.settings.addHiddenRTL); t.onChange(async v=>{ this.plugin.settings.addHiddenRTL=v; await this.plugin.saveSettings(); }); });
        new Setting(containerEl).setName('ساخت بکاپ .bak برای پوشه').addToggle(t=>{ t.setValue(this.plugin.settings.createBak); t.onChange(async v=>{ this.plugin.settings.createBak=v; await this.plugin.saveSettings(); }); });
        containerEl.createEl('h3',{text:'پالت رنگ'});
        this.plugin.settings.palette.forEach((c,i)=>{
          new Setting(containerEl).setName(c.name).addText(t=>{ t.setValue(c.value); t.onChange(async v=>{ this.plugin.settings.palette[i].value=v; this.plugin.saveSettings(); }); }).addExtraButton(b=>{ b.setIcon('trash'); b.onClick(async()=>{ this.plugin.settings.palette.splice(i,1); await this.plugin.saveSettings(); this.display(); }); });
        });
        new Setting(containerEl).addButton(b=>{ b.setButtonText('افزودن رنگ'); b.onClick(async()=>{ this.plugin.settings.palette.push({name:'رنگ جدید', value:'#000000'}); await this.plugin.saveSettings(); this.display(); }); });
      }
    })(this.app, this));
  }
  getAllFolders(){
    return this.app.vault.getAllLoadedFiles().filter(f=> f.children).map(f=> f.path).filter(p=> p!=='' && p.split('/').length<=3).sort();
  }
  async saveSettings(){ await this.saveData(this.settings); }
};
