define("userMarksViewModel",["diagnosticsHub","diagnosticsHub-swimlanes","diagnosticsHub-ui","knockout","plugin-vs-v2"],((e,t,r,i,s)=>{return a={103:e=>{const t=document.createElement("script");t.id="IndeterminateProgress",t.innerHTML=atob("PGRpdiBjbGFzcz0ic3Bpbm5lciIgcm9sZT0icHJvZ3Jlc3NiYXIiIGFyaWEtdmFsdWVub3c9IjAiIGFyaWEtdmFsdWVtaW49IjAiIGFyaWEtdmFsdWVtYXg9IjEwMCIgYXJpYS1saXZlPSJhc3NlcnRpdmUiDQogICAgIGRhdGEtYmluZD0ibG9jYWxpemVkQXJpYUxhYmVsOidPdmVybGF5X1Byb2dyZXNzSW5kZXRlcm1pbmF0ZUFyaWFMYWJlbCciPg0KICAgIDxkaXYgY2xhc3M9ImJhcjEiPjwvZGl2Pg0KICAgIDxkaXYgY2xhc3M9ImJhcjIiPjwvZGl2Pg0KICAgIDxkaXYgY2xhc3M9ImJhcjMiPjwvZGl2Pg0KICAgIDxkaXYgY2xhc3M9ImJhcjQiPjwvZGl2Pg0KICAgIDxkaXYgY2xhc3M9ImJhcjUiPjwvZGl2Pg0KICAgIDxkaXYgY2xhc3M9ImJhcjYiPjwvZGl2Pg0KICAgIDxkaXYgY2xhc3M9ImJhcjciPjwvZGl2Pg0KICAgIDxkaXYgY2xhc3M9ImJhcjgiPjwvZGl2Pg0KICAgIDxkaXYgY2xhc3M9ImJhcjkiPjwvZGl2Pg0KICAgIDxkaXYgY2xhc3M9ImJhcjEwIj48L2Rpdj4NCjwvZGl2Pg=="),t.type="text/html",document.head.appendChild(t),e.exports={}},680:e=>{const t=document.createElement("script");t.id="LoadingView",t.innerHTML=atob("PGRpdiBpZD0icHJvZ3Jlc3MtY29udHJvbCI+DQogICAgPHNwYW4gY2xhc3M9Im1lc3NhZ2UiIGRhdGEtYmluZD0ibG9jYWxpemVkVGV4dDogJ0xvYWRpbmdEYXRhTWVzc2FnZSciPjwvc3Bhbj4NCiAgICA8IS0tIGtvIHRlbXBsYXRlOiB7IG5hbWU6ICdJbmRldGVybWluYXRlUHJvZ3Jlc3MnIH0gLS0+PCEtLSAva28gLS0+DQo8L2Rpdj4="),t.type="text/html",document.head.appendChild(t),e.exports={}},338:e=>{const t=document.createElement("script");t.id="UserMarksRowView",t.innerHTML=atob("PHRyIGNsYXNzPSJkYXRhR3JpZFJvdyIgcm9sZT0icm93IiB0YWJpbmRleD0iLTEiIGRhdGEtYmluZD0iDQogICAgZGF0YUdyaWRSb3dGb2N1czogJHBhcmVudC5mb2N1c2VkUm93KCkgPT09ICRkYXRhLA0KICAgIGNzczogeyBzZWxlY3RlZDogc2VsZWN0ZWQoKSB9Ij4NCiAgICA8dGQgcm9sZT0iZ3JpZGNlbGwiIGNsYXNzPSJsZWZ0LWFsaWduIiBkYXRhLWJpbmQ9InRleHQ6IG1hcmtJZCIgZGF0YS1jb2x1bW5pZD0ibWFya0lkIj48L3RkPg0KICAgIDx0ZCByb2xlPSJncmlkY2VsbCIgY2xhc3M9ImxlZnQtYWxpZ24iIGRhdGEtYmluZD0idGV4dDogbmFtZSIgZGF0YS1jb2x1bW5pZD0ibmFtZSI+PC90ZD4NCiAgICA8dGQgcm9sZT0iZ3JpZGNlbGwiIGRhdGEtYmluZD0idGV4dDogZm9ybWF0dGVkVGltZXN0YW1wIiBkYXRhLWNvbHVtbmlkPSJ0aW1lc3RhbXAiPjwvdGQ+DQogICAgPHRkIHJvbGU9ImdyaWRjZWxsIiBkYXRhLWJpbmQ9InRleHQ6IGZvcm1hdHRlZFRpbWVFbmQiIGRhdGEtY29sdW1uaWQ9InRpbWVFbmQiPjwvdGQ+DQogICAgPHRkIHJvbGU9ImdyaWRjZWxsIiBjbGFzcz0ibGVmdC1hbGlnbiIgZGF0YS1iaW5kPSJ0ZXh0OiBwaWQiIGRhdGEtY29sdW1uaWQ9InBpZCI+PC90ZD4NCiAgICA8dGQgcm9sZT0iZ3JpZGNlbGwiIGNsYXNzPSJsZWZ0LWFsaWduIiBkYXRhLWJpbmQ9InRleHQ6IG1lc3NhZ2UiIGRhdGEtY29sdW1uaWQ9Im1lc3NhZ2UiPjwvdGQ+DQo8L3RyPg=="),t.type="text/html",document.head.appendChild(t),e.exports={}},952:(e,t,r)=>{var i;i=function(e,t){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.UserMarksDetailsViewId=t.MarksAnalyzerId=void 0,t.MarksAnalyzerId=function(){return"D278B2D7-2E05-472F-B474-6DDC62F7245E"},t.UserMarksDetailsViewId=function(){return"BEA3C62C-7870-48B1-91ED-978E6D522C2C"}}.apply(t,[r,t]),void 0===i||(e.exports=i)},766:(e,t,r)=>{var i,s;i=[r,t,r(226)],s=function(e,t,r){"use strict";let i;Object.defineProperty(t,"__esModule",{value:!0}),t.UserMarksMarshaler=void 0,t.UserMarksMarshaler=class{constructor(){i||(i=r.JSONMarshaler.attachToMarshaledObject("Microsoft.DiagnosticsHub.Tools.UserMarks.UserMarksMarshaler",{},!0))}getDoubleClickTimeMs(){return i._call("getDoubleClickTimeMs")}getColumnSettings(e){return i._call("getColumnSettings",e)}onColumnChanged(e,t){return i._call("onColumnChanged",e,t)}}}.apply(t,i),void 0===s||(e.exports=s)},945:(e,t,r)=>{var i,s;i=[r,t,r(766)],s=function(e,t,r){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.UserMarksColumnSettingsProvider=void 0,t.UserMarksColumnSettingsProvider=class{constructor(){this._view="DetailsView",this._marshaler=new r.UserMarksMarshaler}getColumnSettings(){return this._marshaler.getColumnSettings(this._view)}onColumnChanged(e){this._marshaler.onColumnChanged(this._view,e)}}}.apply(t,i),void 0===s||(e.exports=s)},259:(e,t,r)=>{var i,s;i=[r,t,r(28),r(952),r(117),r(881),r(881),r(0),r(881)],s=function(e,t,r,i,s,a,n,o,d){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.UserMarksDAO=void 0;class l{constructor(e,t){this._filterText=r.observable(""),this._dataLoadStatus=r.observable(d.DataLoadEvent.DataLoadStart),this._dataWarehouse=e,this._logger=s.getLogger("UserMarksDAO"),this._timeFilter=r.observable(t),this._rows=a.AsyncComputed((()=>{const e={timeDomain:this.timeFilter(),customDomain:{task:"get-user-marks"}};return this._dataWarehouse.getFilteredData(e,i.MarksAnalyzerId()).then((e=>{this._logger.debug("Data loaded, updating rows");const t=e.marks.map(((t,r)=>{const i=t.pid.toString();let s=t.id;return e.idMap[i]&&e.idMap[i][t.id]&&(s=e.idMap[i][t.id]),new o.UserMarksRowViewModel(t,this,r,s)}));return this._dataLoadStatus(d.DataLoadEvent.DataLoadCompleted),Promise.resolve(t)}),(e=>("Canceled"!==e.name&&this._dataLoadStatus(d.DataLoadEvent.DataLoadFailed),Promise.resolve([]))))}),void 0,[]),this._filteredRows=r.computed((()=>this._filterText()?this.filterRows():this.rows())),this._timeFilter.notifySubscribers(t)}get filterText(){return this._filterText}get timeFilter(){return this._timeFilter}get defaultSortColumnId(){return"timestamp"}get dataLoadStatus(){return this._dataLoadStatus}get rows(){return this._rows}get filteredRows(){return this._filteredRows}getCount(e){throw new Error("Method not implemented.")}getRows(e,t){return this.sort(this._filteredRows(),t)}search(e,t,r,i,s,a,n){throw new Error("Method not implemented.")}sort(e,t,r){r?.throwIfCancellationRequested();const i=l.SortFunc[t.columnId](t.direction);return e.sort(i),Promise.resolve(e)}filter(e,t){throw new Error("Method not implemented.")}filterRows(){const e=this.filterText().toUpperCase();return this._rows().filter((t=>{const r=t.name.toUpperCase().includes(e),i=t.markId.toUpperCase().includes(e),s=t.message.toUpperCase().includes(e);return r||i||s}))}}t.UserMarksDAO=l,l.SortFunc={name:e=>n.SortFunctions.stringSort("name",e),timestamp:e=>n.SortFunctions.numericSort("timestamp",e),message:e=>n.SortFunctions.stringSort("message",e),timeEnd:e=>n.SortFunctions.numericSort("timeEnd",e),pid:e=>n.SortFunctions.numericSort("pid",e)}}.apply(t,i),void 0===s||(e.exports=s)},0:(e,t,r)=>{var i,s;i=[r,t,r(28),r(226),r(117),r(560),r(117),r(338)],s=function(e,t,r,i,s,a,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.UserMarksRowViewModel=void 0,t.UserMarksRowViewModel=class{constructor(e,t,a,n){this._selected=r.observable(!1),this._logger=s.getLogger("UserMarksRowViewModel"),this._row=e,this._dao=t,this._id=a,this._name=n,this._noTimeEnd=i.Resources.getString("MarksListNoTimeEnd")}get name(){return this._name}get pid(){return this._row.pid}get message(){return this._row.data}get timeEnd(){return this._row.timeEnd}get timestamp(){return this._row.timestamp}get formattedTimestamp(){return a.RulerUtilities.formatTime(n.BigNumber.convertFromNumber(this._row.timestamp))}get formattedTimeEnd(){return null!==this._row.timeEnd?a.RulerUtilities.formatTime(n.BigNumber.convertFromNumber(this._row.timeEnd)):this._noTimeEnd}get markId(){return this._row.id}get templateName(){return"UserMarksRowView"}get id(){return this._id}get selected(){return this._selected}invoke(){this._logger.debug("UserMarksRowViewModel: Invoke called")}}}.apply(t,i),void 0===s||(e.exports=s)},937:(e,t,r)=>{var i,s;i=[r,t,r(226),r(28),r(952),r(117),r(881),r(881),r(881),r(259),r(881),r(945),r(117),r(766),r(881),r(560),r(117),r(680),r(103)],s=function(e,t,r,i,s,a,n,o,d,l,m,c,u,g,h,p,I){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.UserMarksViewModel=void 0;var M=r.ContextMenu;class b{constructor(){this._viewEventManager=u.getViewEventManager(),this._currentOverlay=i.pureComputed((()=>this.computeOverlay())),this._filterText=i.observable(""),a.loadDataWarehouse().then((e=>(this._dataWarehouse=e,e.getContextService().getGlobalContext()))).then((e=>e.getTimeDomain())).then((e=>{this._userMarksDAO=new l.UserMarksDAO(this._dataWarehouse,e);const t=new o.DataGridHeaderViewModel([{id:"markId",text:r.Resources.getString("MarksListHeaderId"),hideable:!1},{id:"name",text:r.Resources.getString("MarksListHeaderName"),hideable:!1,sortable:m.SortDirection.Asc},{id:"timestamp",text:r.Resources.getString("MarksListHeaderTimestamp"),hideable:!0,sortable:m.SortDirection.Asc},{id:"timeEnd",text:r.Resources.getString("MarksListHeaderTimeEnd"),hideable:!0,sortable:m.SortDirection.Asc},{id:"pid",text:r.Resources.getString("MarksListHeaderProcessId"),hideable:!0,sortable:m.SortDirection.Asc},{id:"message",text:r.Resources.getString("MarksListHeaderMessage"),hideable:!0,sortable:m.SortDirection.Asc}],new c.UserMarksColumnSettingsProvider,this._userMarksDAO.defaultSortColumnId);this._marksGrid=new n.DataGridViewModel(this._userMarksDAO,t,"UserMarksListAriaLabel"),this._marksGrid.onResultChanged(0),this._userMarksDAO.filteredRows.subscribe((()=>{this._marksGrid.onResultChanged(0)})),this._filterText.subscribe((e=>{""===e&&this._userMarksDAO.filterText(this._filterText())})),this._viewEventManager.selectionChanged.addEventListener((e=>{e.isIntermittent||this._userMarksDAO.timeFilter(e.position)})),i.applyBindings(this),this._viewEventManager.detailsViewReady.raiseEvent({Id:s.UserMarksDetailsViewId()})}))}get marksGrid(){return this._marksGrid}get filterText(){return this._filterText}get currentOverlay(){return this._currentOverlay}get filterTooltip(){return r.Resources.getString("MarksListFilterToolTip")}onFilterKeyDown(e,t){return"Enter"===t.key?(this._userMarksDAO.filterText(this._filterText()),this.marksGrid.onResultChanged(1),!1):"Escape"!==t.key||(this.filterText(""),!1)}onKeyDown(e,t){if(!t.ctrlKey||t.keyCode!==p.KeyCodes.C)return!0;const r=d.DataGridUtils.formatDataGridSelectedToText(this.marksGrid);return navigator.clipboard.writeText(r),!1}contextMenu(e,t){const i=e;if("number"!=typeof i.id||0===this._marksGrid.selectedRows().length)return null;const s=[{label:r.Resources.getString("ContextMenu_SetStart"),callback:()=>{const e=this._userMarksDAO.timeFilter().end;this._viewEventManager.selectionChanged.raiseEvent({position:new I.JsonTimespan(I.BigNumber.convertFromNumber(i.timestamp),e),isIntermittent:!1})},type:M.MenuItemType.command},{label:r.Resources.getString("ContextMenu_SetEnd"),callback:()=>{const e=this._userMarksDAO.timeFilter().begin;this._viewEventManager.selectionChanged.raiseEvent({position:new I.JsonTimespan(e,I.BigNumber.convertFromNumber(i.timestamp)),isIntermittent:!1})},type:M.MenuItemType.command},{label:r.Resources.getString("ContextMenu_SetInterval"),callback:()=>{const e=this.marksGrid.selectedRows().map((e=>this.marksGrid.rows()[e])),t=this.getMinMaxTimestamp(e);this._viewEventManager.selectionChanged.raiseEvent({position:new I.JsonTimespan(I.BigNumber.convertFromNumber(t.min),I.BigNumber.convertFromNumber(t.max)),isIntermittent:!1})},type:M.MenuItemType.command,disabled:()=>this.marksGrid.selectedRows().length<2&&null===i.timeEnd}];return M.create(s)}getMinMaxTimestamp(e){let t=Number.MAX_VALUE,r=Number.MIN_VALUE;for(const i of e)i.timestamp<t&&(t=i.timestamp),i.timeEnd&&i.timeEnd>r&&(r=i.timeEnd);return{min:t,max:r}}computeOverlay(){return this._userMarksDAO.dataLoadStatus()===m.DataLoadEvent.DataLoadStart?{name:"LoadingView"}:null}}t.UserMarksViewModel=b,(new g.UserMarksMarshaler).getDoubleClickTimeMs().then((e=>{h.Init(e),new b}))}.apply(t,i),void 0===s||(e.exports=s)},117:t=>{"use strict";t.exports=e},560:e=>{"use strict";e.exports=t},881:e=>{"use strict";e.exports=r},28:e=>{"use strict";e.exports=i},226:e=>{"use strict";e.exports=s}},n={},function e(t){var r=n[t];if(void 0!==r)return r.exports;var i=n[t]={exports:{}};return a[t](i,i.exports,e),i.exports}(937);var a,n}));
// SIG // Begin signature block
// SIG // MIIoUwYJKoZIhvcNAQcCoIIoRDCCKEACAQExDzANBglg
// SIG // hkgBZQMEAgEFADB3BgorBgEEAYI3AgEEoGkwZzAyBgor
// SIG // BgEEAYI3AgEeMCQCAQEEEBDgyQbOONQRoqMAEEvTUJAC
// SIG // AQACAQACAQACAQACAQAwMTANBglghkgBZQMEAgEFAAQg
// SIG // 0ivzSUki1Jvgu+hMKvmVGpyaUjf7wu8LOXJRSBtqdHGg
// SIG // gg2FMIIGAzCCA+ugAwIBAgITMwAABAO91ZVdDzsYrQAA
// SIG // AAAEAzANBgkqhkiG9w0BAQsFADB+MQswCQYDVQQGEwJV
// SIG // UzETMBEGA1UECBMKV2FzaGluZ3RvbjEQMA4GA1UEBxMH
// SIG // UmVkbW9uZDEeMBwGA1UEChMVTWljcm9zb2Z0IENvcnBv
// SIG // cmF0aW9uMSgwJgYDVQQDEx9NaWNyb3NvZnQgQ29kZSBT
// SIG // aWduaW5nIFBDQSAyMDExMB4XDTI0MDkxMjIwMTExM1oX
// SIG // DTI1MDkxMTIwMTExM1owdDELMAkGA1UEBhMCVVMxEzAR
// SIG // BgNVBAgTCldhc2hpbmd0b24xEDAOBgNVBAcTB1JlZG1v
// SIG // bmQxHjAcBgNVBAoTFU1pY3Jvc29mdCBDb3Jwb3JhdGlv
// SIG // bjEeMBwGA1UEAxMVTWljcm9zb2Z0IENvcnBvcmF0aW9u
// SIG // MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA
// SIG // n3RnXcCDp20WFMoNNzt4s9fV12T5roRJlv+bshDfvJoM
// SIG // ZfhyRnixgUfGAbrRlS1St/EcXFXD2MhRkF3CnMYIoeMO
// SIG // MuMyYtxr2sC2B5bDRMUMM/r9I4GP2nowUthCWKFIS1RP
// SIG // lM0YoVfKKMaH7bJii29sW+waBUulAKN2c+Gn5znaiOxR
// SIG // qIu4OL8f9DCHYpME5+Teek3SL95sH5GQhZq7CqTdM0fB
// SIG // w/FmLLx98SpBu7v8XapoTz6jJpyNozhcP/59mi/Fu4tT
// SIG // 2rI2vD50Vx/0GlR9DNZ2py/iyPU7DG/3p1n1zluuRp3u
// SIG // XKjDfVKH7xDbXcMBJid22a3CPbuC2QJLowIDAQABo4IB
// SIG // gjCCAX4wHwYDVR0lBBgwFgYKKwYBBAGCN0wIAQYIKwYB
// SIG // BQUHAwMwHQYDVR0OBBYEFOpuKgJKc+OuNYitoqxfHlrE
// SIG // gXAZMFQGA1UdEQRNMEukSTBHMS0wKwYDVQQLEyRNaWNy
// SIG // b3NvZnQgSXJlbGFuZCBPcGVyYXRpb25zIExpbWl0ZWQx
// SIG // FjAUBgNVBAUTDTIzMDAxMis1MDI5MjYwHwYDVR0jBBgw
// SIG // FoAUSG5k5VAF04KqFzc3IrVtqMp1ApUwVAYDVR0fBE0w
// SIG // SzBJoEegRYZDaHR0cDovL3d3dy5taWNyb3NvZnQuY29t
// SIG // L3BraW9wcy9jcmwvTWljQ29kU2lnUENBMjAxMV8yMDEx
// SIG // LTA3LTA4LmNybDBhBggrBgEFBQcBAQRVMFMwUQYIKwYB
// SIG // BQUHMAKGRWh0dHA6Ly93d3cubWljcm9zb2Z0LmNvbS9w
// SIG // a2lvcHMvY2VydHMvTWljQ29kU2lnUENBMjAxMV8yMDEx
// SIG // LTA3LTA4LmNydDAMBgNVHRMBAf8EAjAAMA0GCSqGSIb3
// SIG // DQEBCwUAA4ICAQBRaP+hOC1+dSKhbqCr1LIvNEMrRiOQ
// SIG // EkPc7D6QWtM+/IbrYiXesNeeCZHCMf3+6xASuDYQ+AyB
// SIG // TX0YlXSOxGnBLOzgEukBxezbfnhUTTk7YB2/TxMUcuBC
// SIG // P45zMM0CVTaJE8btloB6/3wbFrOhvQHCILx41jTd6kUq
// SIG // 4bIBHah3NG0Q1H/FCCwHRGTjAbyiwq5n/pCTxLz5XYCu
// SIG // 4RTvy/ZJnFXuuwZynowyju90muegCToTOwpHgE6yRcTv
// SIG // Ri16LKCr68Ab8p8QINfFvqWoEwJCXn853rlkpp4k7qzw
// SIG // lBNiZ71uw2pbzjQzrRtNbCFQAfmoTtsHFD2tmZvQIg1Q
// SIG // VkzM/V1KCjHL54ItqKm7Ay4WyvqWK0VIEaTbdMtbMWbF
// SIG // zq2hkRfJTNnFr7RJFeVC/k0DNaab+bpwx5FvCUvkJ3z2
// SIG // wfHWVUckZjEOGmP7cecefrF+rHpif/xW4nJUjMUiPsyD
// SIG // btY2Hq3VMLgovj+qe0pkJgpYQzPukPm7RNhbabFNFvq+
// SIG // kXWBX/z/pyuo9qLZfTb697Vi7vll5s/DBjPtfMpyfpWG
// SIG // 0phVnAI+0mM4gH09LCMJUERZMgu9bbCGVIQR7cT5YhlL
// SIG // t+tpSDtC6XtAzq4PJbKZxFjpB5wk+SRJ1gm87olbfEV9
// SIG // SFdO7iL3jWbjgVi1Qs1iYxBmvh4WhLWr48uouzCCB3ow
// SIG // ggVioAMCAQICCmEOkNIAAAAAAAMwDQYJKoZIhvcNAQEL
// SIG // BQAwgYgxCzAJBgNVBAYTAlVTMRMwEQYDVQQIEwpXYXNo
// SIG // aW5ndG9uMRAwDgYDVQQHEwdSZWRtb25kMR4wHAYDVQQK
// SIG // ExVNaWNyb3NvZnQgQ29ycG9yYXRpb24xMjAwBgNVBAMT
// SIG // KU1pY3Jvc29mdCBSb290IENlcnRpZmljYXRlIEF1dGhv
// SIG // cml0eSAyMDExMB4XDTExMDcwODIwNTkwOVoXDTI2MDcw
// SIG // ODIxMDkwOVowfjELMAkGA1UEBhMCVVMxEzARBgNVBAgT
// SIG // Cldhc2hpbmd0b24xEDAOBgNVBAcTB1JlZG1vbmQxHjAc
// SIG // BgNVBAoTFU1pY3Jvc29mdCBDb3Jwb3JhdGlvbjEoMCYG
// SIG // A1UEAxMfTWljcm9zb2Z0IENvZGUgU2lnbmluZyBQQ0Eg
// SIG // MjAxMTCCAiIwDQYJKoZIhvcNAQEBBQADggIPADCCAgoC
// SIG // ggIBAKvw+nIQHC6t2G6qghBNNLrytlghn0IbKmvpWlCq
// SIG // uAY4GgRJun/DDB7dN2vGEtgL8DjCmQawyDnVARQxQtOJ
// SIG // DXlkh36UYCRsr55JnOloXtLfm1OyCizDr9mpK656Ca/X
// SIG // llnKYBoF6WZ26DJSJhIv56sIUM+zRLdd2MQuA3WraPPL
// SIG // bfM6XKEW9Ea64DhkrG5kNXimoGMPLdNAk/jj3gcN1Vx5
// SIG // pUkp5w2+oBN3vpQ97/vjK1oQH01WKKJ6cuASOrdJXtjt
// SIG // 7UORg9l7snuGG9k+sYxd6IlPhBryoS9Z5JA7La4zWMW3
// SIG // Pv4y07MDPbGyr5I4ftKdgCz1TlaRITUlwzluZH9TupwP
// SIG // rRkjhMv0ugOGjfdf8NBSv4yUh7zAIXQlXxgotswnKDgl
// SIG // mDlKNs98sZKuHCOnqWbsYR9q4ShJnV+I4iVd0yFLPlLE
// SIG // tVc/JAPw0XpbL9Uj43BdD1FGd7P4AOG8rAKCX9vAFbO9
// SIG // G9RVS+c5oQ/pI0m8GLhEfEXkwcNyeuBy5yTfv0aZxe/C
// SIG // HFfbg43sTUkwp6uO3+xbn6/83bBm4sGXgXvt1u1L50kp
// SIG // pxMopqd9Z4DmimJ4X7IvhNdXnFy/dygo8e1twyiPLI9A
// SIG // N0/B4YVEicQJTMXUpUMvdJX3bvh4IFgsE11glZo+TzOE
// SIG // 2rCIF96eTvSWsLxGoGyY0uDWiIwLAgMBAAGjggHtMIIB
// SIG // 6TAQBgkrBgEEAYI3FQEEAwIBADAdBgNVHQ4EFgQUSG5k
// SIG // 5VAF04KqFzc3IrVtqMp1ApUwGQYJKwYBBAGCNxQCBAwe
// SIG // CgBTAHUAYgBDAEEwCwYDVR0PBAQDAgGGMA8GA1UdEwEB
// SIG // /wQFMAMBAf8wHwYDVR0jBBgwFoAUci06AjGQQ7kUBU7h
// SIG // 6qfHMdEjiTQwWgYDVR0fBFMwUTBPoE2gS4ZJaHR0cDov
// SIG // L2NybC5taWNyb3NvZnQuY29tL3BraS9jcmwvcHJvZHVj
// SIG // dHMvTWljUm9vQ2VyQXV0MjAxMV8yMDExXzAzXzIyLmNy
// SIG // bDBeBggrBgEFBQcBAQRSMFAwTgYIKwYBBQUHMAKGQmh0
// SIG // dHA6Ly93d3cubWljcm9zb2Z0LmNvbS9wa2kvY2VydHMv
// SIG // TWljUm9vQ2VyQXV0MjAxMV8yMDExXzAzXzIyLmNydDCB
// SIG // nwYDVR0gBIGXMIGUMIGRBgkrBgEEAYI3LgMwgYMwPwYI
// SIG // KwYBBQUHAgEWM2h0dHA6Ly93d3cubWljcm9zb2Z0LmNv
// SIG // bS9wa2lvcHMvZG9jcy9wcmltYXJ5Y3BzLmh0bTBABggr
// SIG // BgEFBQcCAjA0HjIgHQBMAGUAZwBhAGwAXwBwAG8AbABp
// SIG // AGMAeQBfAHMAdABhAHQAZQBtAGUAbgB0AC4gHTANBgkq
// SIG // hkiG9w0BAQsFAAOCAgEAZ/KGpZjgVHkaLtPYdGcimwuW
// SIG // EeFjkplCln3SeQyQwWVfLiw++MNy0W2D/r4/6ArKO79H
// SIG // qaPzadtjvyI1pZddZYSQfYtGUFXYDJJ80hpLHPM8QotS
// SIG // 0LD9a+M+By4pm+Y9G6XUtR13lDni6WTJRD14eiPzE32m
// SIG // kHSDjfTLJgJGKsKKELukqQUMm+1o+mgulaAqPyprWElj
// SIG // HwlpblqYluSD9MCP80Yr3vw70L01724lruWvJ+3Q3fMO
// SIG // r5kol5hNDj0L8giJ1h/DMhji8MUtzluetEk5CsYKwsat
// SIG // ruWy2dsViFFFWDgycScaf7H0J/jeLDogaZiyWYlobm+n
// SIG // t3TDQAUGpgEqKD6CPxNNZgvAs0314Y9/HG8VfUWnduVA
// SIG // KmWjw11SYobDHWM2l4bf2vP48hahmifhzaWX0O5dY0Hj
// SIG // Wwechz4GdwbRBrF1HxS+YWG18NzGGwS+30HHDiju3mUv
// SIG // 7Jf2oVyW2ADWoUa9WfOXpQlLSBCZgB/QACnFsZulP0V3
// SIG // HjXG0qKin3p6IvpIlR+r+0cjgPWe+L9rt0uX4ut1eBrs
// SIG // 6jeZeRhL/9azI2h15q/6/IvrC4DqaTuv/DDtBEyO3991
// SIG // bWORPdGdVk5Pv4BXIqF4ETIheu9BCrE/+6jMpF3BoYib
// SIG // V3FWTkhFwELJm3ZbCoBIa/15n8G9bW1qyVJzEw16UM0x
// SIG // ghomMIIaIgIBATCBlTB+MQswCQYDVQQGEwJVUzETMBEG
// SIG // A1UECBMKV2FzaGluZ3RvbjEQMA4GA1UEBxMHUmVkbW9u
// SIG // ZDEeMBwGA1UEChMVTWljcm9zb2Z0IENvcnBvcmF0aW9u
// SIG // MSgwJgYDVQQDEx9NaWNyb3NvZnQgQ29kZSBTaWduaW5n
// SIG // IFBDQSAyMDExAhMzAAAEA73VlV0POxitAAAAAAQDMA0G
// SIG // CWCGSAFlAwQCAQUAoIGuMBkGCSqGSIb3DQEJAzEMBgor
// SIG // BgEEAYI3AgEEMBwGCisGAQQBgjcCAQsxDjAMBgorBgEE
// SIG // AYI3AgEVMC8GCSqGSIb3DQEJBDEiBCAQQ/7dYVfnohHl
// SIG // w7El8BjN/zQQYAbQQK/hHbc6oHZ7kDBCBgorBgEEAYI3
// SIG // AgEMMTQwMqAUgBIATQBpAGMAcgBvAHMAbwBmAHShGoAY
// SIG // aHR0cDovL3d3dy5taWNyb3NvZnQuY29tMA0GCSqGSIb3
// SIG // DQEBAQUABIIBADcSvOi5yAF7mbMVF/OddEr7fA+ePDZz
// SIG // BErm1w6mSi60ezm7c+ql33/DwxmFD7R7U/X2EY2KRdKE
// SIG // JOdE8/2LrBFWdWsxiNtu20OwCzRrCTxMkk6hafhGJRuf
// SIG // NCDLqgR4TBxz9tv4AwjWWzzPk5L9yJ4Xa4+4rJmX0x+B
// SIG // /MdvYbPlczCtQ6R1VwtM8LwGRs4KFowNq9xfO5VOPkOa
// SIG // mmxi/qTm0o0usjXCQbeKQgdLn3ixxkvzEkgGk6vnE8HW
// SIG // C9GGsM/v/qjSa2obaeQSCp/Q0BA4WY6WeN1nuFWaiww1
// SIG // b8TqjrctxOED96y2Rc51FFFN4upSmhB8Xwg3czfRQEzc
// SIG // heihghewMIIXrAYKKwYBBAGCNwMDATGCF5wwgheYBgkq
// SIG // hkiG9w0BBwKggheJMIIXhQIBAzEPMA0GCWCGSAFlAwQC
// SIG // AQUAMIIBWgYLKoZIhvcNAQkQAQSgggFJBIIBRTCCAUEC
// SIG // AQEGCisGAQQBhFkKAwEwMTANBglghkgBZQMEAgEFAAQg
// SIG // tIjhrEZIJzZA+QtQGCRsJN2vLh6M5lhN+UhBH53JyyMC
// SIG // BmhTGUylhRgTMjAyNTA2MzAxNDQzMzcuMzk1WjAEgAIB
// SIG // 9KCB2aSB1jCB0zELMAkGA1UEBhMCVVMxEzARBgNVBAgT
// SIG // Cldhc2hpbmd0b24xEDAOBgNVBAcTB1JlZG1vbmQxHjAc
// SIG // BgNVBAoTFU1pY3Jvc29mdCBDb3Jwb3JhdGlvbjEtMCsG
// SIG // A1UECxMkTWljcm9zb2Z0IElyZWxhbmQgT3BlcmF0aW9u
// SIG // cyBMaW1pdGVkMScwJQYDVQQLEx5uU2hpZWxkIFRTUyBF
// SIG // U046NTUxQS0wNUUwLUQ5NDcxJTAjBgNVBAMTHE1pY3Jv
// SIG // c29mdCBUaW1lLVN0YW1wIFNlcnZpY2WgghH+MIIHKDCC
// SIG // BRCgAwIBAgITMwAAAgHRRVmYEMxCTwABAAACATANBgkq
// SIG // hkiG9w0BAQsFADB8MQswCQYDVQQGEwJVUzETMBEGA1UE
// SIG // CBMKV2FzaGluZ3RvbjEQMA4GA1UEBxMHUmVkbW9uZDEe
// SIG // MBwGA1UEChMVTWljcm9zb2Z0IENvcnBvcmF0aW9uMSYw
// SIG // JAYDVQQDEx1NaWNyb3NvZnQgVGltZS1TdGFtcCBQQ0Eg
// SIG // MjAxMDAeFw0yNDA3MjUxODMxMjJaFw0yNTEwMjIxODMx
// SIG // MjJaMIHTMQswCQYDVQQGEwJVUzETMBEGA1UECBMKV2Fz
// SIG // aGluZ3RvbjEQMA4GA1UEBxMHUmVkbW9uZDEeMBwGA1UE
// SIG // ChMVTWljcm9zb2Z0IENvcnBvcmF0aW9uMS0wKwYDVQQL
// SIG // EyRNaWNyb3NvZnQgSXJlbGFuZCBPcGVyYXRpb25zIExp
// SIG // bWl0ZWQxJzAlBgNVBAsTHm5TaGllbGQgVFNTIEVTTjo1
// SIG // NTFBLTA1RTAtRDk0NzElMCMGA1UEAxMcTWljcm9zb2Z0
// SIG // IFRpbWUtU3RhbXAgU2VydmljZTCCAiIwDQYJKoZIhvcN
// SIG // AQEBBQADggIPADCCAgoCggIBALVq3/h8w7u7JOdMuWB4
// SIG // XgiCRtLsUUhRXBzXpPk3fWZsiY9tBBI2lPCQybuaVnOK
// SIG // TwLASN/DRACdW/igZ5UralPLr1xeKpxEoQ3YvJz7GWUL
// SIG // E2QylgIFDNomUzoliLmXBbOWQvP/hpa1SzOYdWPZ3zIe
// SIG // QeA51EDlzK3pgE/TJL1IYN7mmIJqi5ZmMjg5m2uJV2Qb
// SIG // tdOEiwBbFzn5f0y4aU6E+Osu5SPbGyPbqt/wHq4d2j4t
// SIG // pJx7xBGs4pV3qKFzSwsHbviLOqPJEC6LlJ9ysFEJtG+2
// SIG // lLbL9V/zoD5rDiYusjdy2FshyEr6zbiKyeImDYB3QQbp
// SIG // kGCvC42ZkGkyhWnMYZlydKtoM2iH8RdsiMDPlfbEKpB5
// SIG // IP0PokgzaTK+pq/zsJJzhCIyNIOmTDspor6QocwzaD8/
// SIG // YZCt4FR2SluzVfPlAVzeBtGgV+vXylG8QQS8pNnAvj4T
// SIG // qFI5JelAvP3NIbqo+cV/JvmFSJPNXu7eiPlfxOMl0Xnm
// SIG // YK9BYWKjab04xnGjtlq5D+V5rGEuyLzDyH+AwsiCVGWq
// SIG // qATE6ACSRxkXvgz6gh4Om5hj5vezKzlr9evwqOkvXEA5
// SIG // F6fbzEkkUFl8uCrSYWX5rg89r69Y8ODXoscLiAxsNZrV
// SIG // f03UiPr6SyX1Ii5f2/cP7SQfdgQC0E/HtWB/DaYXTqNc
// SIG // QsJHAgMBAAGjggFJMIIBRTAdBgNVHQ4EFgQUsHKvW5ai
// SIG // 6Dz4la8pvZhZhVm8slIwHwYDVR0jBBgwFoAUn6cVXQBe
// SIG // Yl2D9OXSZacbUzUZ6XIwXwYDVR0fBFgwVjBUoFKgUIZO
// SIG // aHR0cDovL3d3dy5taWNyb3NvZnQuY29tL3BraW9wcy9j
// SIG // cmwvTWljcm9zb2Z0JTIwVGltZS1TdGFtcCUyMFBDQSUy
// SIG // MDIwMTAoMSkuY3JsMGwGCCsGAQUFBwEBBGAwXjBcBggr
// SIG // BgEFBQcwAoZQaHR0cDovL3d3dy5taWNyb3NvZnQuY29t
// SIG // L3BraW9wcy9jZXJ0cy9NaWNyb3NvZnQlMjBUaW1lLVN0
// SIG // YW1wJTIwUENBJTIwMjAxMCgxKS5jcnQwDAYDVR0TAQH/
// SIG // BAIwADAWBgNVHSUBAf8EDDAKBggrBgEFBQcDCDAOBgNV
// SIG // HQ8BAf8EBAMCB4AwDQYJKoZIhvcNAQELBQADggIBADo0
// SIG // AMs9HFc7UxRql1+SS0cRSvzv6DHuebg6hAvFXdYG3DNv
// SIG // CgVD4L1CD15v73QzdiFQZFh5sAqeACHMuHWbZLlJndH5
// SIG // 7umk/TL6NZ3bC6dmCXDKBSxLd07a4i2jvouBq79GVC7V
// SIG // l1DwFvzJ+UnI4J9MWXbhjwQ/17Nye/oHrffvGbwYqbIP
// SIG // ze6aIpmDlbB8S3Hpu1eV3TDbMrU5v7gqJoTP8IEeSpQ2
// SIG // E1TQFwcXEijHiWog91dfh4TZFZYjJeVTj/p8OcVheebv
// SIG // Yenhdhu3gT6k/qkhUPq0AkHSKzdMhtUDfTya6ILivhSU
// SIG // CXUM3Xw90VlbHIgcoG2GmZU9XBiSNSMkO+A0NFAXU6X3
// SIG // hrMqxEPTyPEMqlS6m9quy7SOgyTDaYWLvo6//9LKa9VF
// SIG // b8gz7bkZ2xkETYtQjsCXI/TmJpZBYCjXgn2w0+1N7hDr
// SIG // 1qJnpF+tGP5ubrUXFD1XgD3YZAfg8Q2nr9ydcsAzXcrv
// SIG // ddZwFT4EZMioDCt1Eixt+xHZWrQ5PBcrgq8eLYh8qhzt
// SIG // 8BOsT8N9kPHv75rkD6AWbl96lHqBSLMmRHpx6tknDLp4
// SIG // XKlt9klFQIuaGeGd53+3QIDWrttTRD8IFvtsJKzag4Ox
// SIG // 6fMh8qDim4BAbukREG70n2eSoeD1fktoMX9rquhqGA55
// SIG // agATjGMM99PSEotGzzIfMIIHcTCCBVmgAwIBAgITMwAA
// SIG // ABXF52ueAptJmQAAAAAAFTANBgkqhkiG9w0BAQsFADCB
// SIG // iDELMAkGA1UEBhMCVVMxEzARBgNVBAgTCldhc2hpbmd0
// SIG // b24xEDAOBgNVBAcTB1JlZG1vbmQxHjAcBgNVBAoTFU1p
// SIG // Y3Jvc29mdCBDb3Jwb3JhdGlvbjEyMDAGA1UEAxMpTWlj
// SIG // cm9zb2Z0IFJvb3QgQ2VydGlmaWNhdGUgQXV0aG9yaXR5
// SIG // IDIwMTAwHhcNMjEwOTMwMTgyMjI1WhcNMzAwOTMwMTgz
// SIG // MjI1WjB8MQswCQYDVQQGEwJVUzETMBEGA1UECBMKV2Fz
// SIG // aGluZ3RvbjEQMA4GA1UEBxMHUmVkbW9uZDEeMBwGA1UE
// SIG // ChMVTWljcm9zb2Z0IENvcnBvcmF0aW9uMSYwJAYDVQQD
// SIG // Ex1NaWNyb3NvZnQgVGltZS1TdGFtcCBQQ0EgMjAxMDCC
// SIG // AiIwDQYJKoZIhvcNAQEBBQADggIPADCCAgoCggIBAOTh
// SIG // pkzntHIhC3miy9ckeb0O1YLT/e6cBwfSqWxOdcjKNVf2
// SIG // AX9sSuDivbk+F2Az/1xPx2b3lVNxWuJ+Slr+uDZnhUYj
// SIG // DLWNE893MsAQGOhgfWpSg0S3po5GawcU88V29YZQ3MFE
// SIG // yHFcUTE3oAo4bo3t1w/YJlN8OWECesSq/XJprx2rrPY2
// SIG // vjUmZNqYO7oaezOtgFt+jBAcnVL+tuhiJdxqD89d9P6O
// SIG // U8/W7IVWTe/dvI2k45GPsjksUZzpcGkNyjYtcI4xyDUo
// SIG // veO0hyTD4MmPfrVUj9z6BVWYbWg7mka97aSueik3rMvr
// SIG // g0XnRm7KMtXAhjBcTyziYrLNueKNiOSWrAFKu75xqRdb
// SIG // Z2De+JKRHh09/SDPc31BmkZ1zcRfNN0Sidb9pSB9fvzZ
// SIG // nkXftnIv231fgLrbqn427DZM9ituqBJR6L8FA6PRc6ZN
// SIG // N3SUHDSCD/AQ8rdHGO2n6Jl8P0zbr17C89XYcz1DTsEz
// SIG // OUyOArxCaC4Q6oRRRuLRvWoYWmEBc8pnol7XKHYC4jMY
// SIG // ctenIPDC+hIK12NvDMk2ZItboKaDIV1fMHSRlJTYuVD5
// SIG // C4lh8zYGNRiER9vcG9H9stQcxWv2XFJRXRLbJbqvUAV6
// SIG // bMURHXLvjflSxIUXk8A8FdsaN8cIFRg/eKtFtvUeh17a
// SIG // j54WcmnGrnu3tz5q4i6tAgMBAAGjggHdMIIB2TASBgkr
// SIG // BgEEAYI3FQEEBQIDAQABMCMGCSsGAQQBgjcVAgQWBBQq
// SIG // p1L+ZMSavoKRPEY1Kc8Q/y8E7jAdBgNVHQ4EFgQUn6cV
// SIG // XQBeYl2D9OXSZacbUzUZ6XIwXAYDVR0gBFUwUzBRBgwr
// SIG // BgEEAYI3TIN9AQEwQTA/BggrBgEFBQcCARYzaHR0cDov
// SIG // L3d3dy5taWNyb3NvZnQuY29tL3BraW9wcy9Eb2NzL1Jl
// SIG // cG9zaXRvcnkuaHRtMBMGA1UdJQQMMAoGCCsGAQUFBwMI
// SIG // MBkGCSsGAQQBgjcUAgQMHgoAUwB1AGIAQwBBMAsGA1Ud
// SIG // DwQEAwIBhjAPBgNVHRMBAf8EBTADAQH/MB8GA1UdIwQY
// SIG // MBaAFNX2VsuP6KJcYmjRPZSQW9fOmhjEMFYGA1UdHwRP
// SIG // ME0wS6BJoEeGRWh0dHA6Ly9jcmwubWljcm9zb2Z0LmNv
// SIG // bS9wa2kvY3JsL3Byb2R1Y3RzL01pY1Jvb0NlckF1dF8y
// SIG // MDEwLTA2LTIzLmNybDBaBggrBgEFBQcBAQROMEwwSgYI
// SIG // KwYBBQUHMAKGPmh0dHA6Ly93d3cubWljcm9zb2Z0LmNv
// SIG // bS9wa2kvY2VydHMvTWljUm9vQ2VyQXV0XzIwMTAtMDYt
// SIG // MjMuY3J0MA0GCSqGSIb3DQEBCwUAA4ICAQCdVX38Kq3h
// SIG // LB9nATEkW+Geckv8qW/qXBS2Pk5HZHixBpOXPTEztTnX
// SIG // wnE2P9pkbHzQdTltuw8x5MKP+2zRoZQYIu7pZmc6U03d
// SIG // mLq2HnjYNi6cqYJWAAOwBb6J6Gngugnue99qb74py27Y
// SIG // P0h1AdkY3m2CDPVtI1TkeFN1JFe53Z/zjj3G82jfZfak
// SIG // Vqr3lbYoVSfQJL1AoL8ZthISEV09J+BAljis9/kpicO8
// SIG // F7BUhUKz/AyeixmJ5/ALaoHCgRlCGVJ1ijbCHcNhcy4s
// SIG // a3tuPywJeBTpkbKpW99Jo3QMvOyRgNI95ko+ZjtPu4b6
// SIG // MhrZlvSP9pEB9s7GdP32THJvEKt1MMU0sHrYUP4KWN1A
// SIG // PMdUbZ1jdEgssU5HLcEUBHG/ZPkkvnNtyo4JvbMBV0lU
// SIG // ZNlz138eW0QBjloZkWsNn6Qo3GcZKCS6OEuabvshVGtq
// SIG // RRFHqfG3rsjoiV5PndLQTHa1V1QJsWkBRH58oWFsc/4K
// SIG // u+xBZj1p/cvBQUl+fpO+y/g75LcVv7TOPqUxUYS8vwLB
// SIG // gqJ7Fx0ViY1w/ue10CgaiQuPNtq6TPmb/wrpNPgkNWcr
// SIG // 4A245oyZ1uEi6vAnQj0llOZ0dFtq0Z4+7X6gMTN9vMvp
// SIG // e784cETRkPHIqzqKOghif9lwY1NNje6CbaUFEMFxBmoQ
// SIG // tB1VM1izoXBm8qGCA1kwggJBAgEBMIIBAaGB2aSB1jCB
// SIG // 0zELMAkGA1UEBhMCVVMxEzARBgNVBAgTCldhc2hpbmd0
// SIG // b24xEDAOBgNVBAcTB1JlZG1vbmQxHjAcBgNVBAoTFU1p
// SIG // Y3Jvc29mdCBDb3Jwb3JhdGlvbjEtMCsGA1UECxMkTWlj
// SIG // cm9zb2Z0IElyZWxhbmQgT3BlcmF0aW9ucyBMaW1pdGVk
// SIG // MScwJQYDVQQLEx5uU2hpZWxkIFRTUyBFU046NTUxQS0w
// SIG // NUUwLUQ5NDcxJTAjBgNVBAMTHE1pY3Jvc29mdCBUaW1l
// SIG // LVN0YW1wIFNlcnZpY2WiIwoBATAHBgUrDgMCGgMVANft
// SIG // unEf8h9dNA4jRRlobgL9q2AaoIGDMIGApH4wfDELMAkG
// SIG // A1UEBhMCVVMxEzARBgNVBAgTCldhc2hpbmd0b24xEDAO
// SIG // BgNVBAcTB1JlZG1vbmQxHjAcBgNVBAoTFU1pY3Jvc29m
// SIG // dCBDb3Jwb3JhdGlvbjEmMCQGA1UEAxMdTWljcm9zb2Z0
// SIG // IFRpbWUtU3RhbXAgUENBIDIwMTAwDQYJKoZIhvcNAQEL
// SIG // BQACBQDsDMBAMCIYDzIwMjUwNjMwMDc1MDI0WhgPMjAy
// SIG // NTA3MDEwNzUwMjRaMHcwPQYKKwYBBAGEWQoEATEvMC0w
// SIG // CgIFAOwMwEACAQAwCgIBAAICAKcCAf8wBwIBAAICErsw
// SIG // CgIFAOwOEcACAQAwNgYKKwYBBAGEWQoEAjEoMCYwDAYK
// SIG // KwYBBAGEWQoDAqAKMAgCAQACAwehIKEKMAgCAQACAwGG
// SIG // oDANBgkqhkiG9w0BAQsFAAOCAQEAStCXYC0+PP0sek2X
// SIG // 4YCdBJIvxFrzJhn++wAPEuHx0LF/6Hjklg3FkjkDo86q
// SIG // GaPdyveaKgxpB1MSEfDtG2PuyyXyO7IqnPnrG9wkmzZY
// SIG // /VdRHZi/KiU3Gk6fmToeYEXGVU9XykCQtwVrUmliUA8E
// SIG // tZtB81RFD/l55QrgKusmnS1JMvyEOLtOvFN990HnmGgh
// SIG // l7bTKsGK28iX46TPWhyclQJe1BkYjeOxDllm7LV0yUvw
// SIG // cKqiZTr/LMmmPStjjR6VcV3Q5WiX9BHljWghradQrhHf
// SIG // ox/I+0Qbsum7vmoQf9gRSfZc46DYsWSWSK3Ha1Odzsjm
// SIG // RVQlmDTTGD15dTObvDGCBA0wggQJAgEBMIGTMHwxCzAJ
// SIG // BgNVBAYTAlVTMRMwEQYDVQQIEwpXYXNoaW5ndG9uMRAw
// SIG // DgYDVQQHEwdSZWRtb25kMR4wHAYDVQQKExVNaWNyb3Nv
// SIG // ZnQgQ29ycG9yYXRpb24xJjAkBgNVBAMTHU1pY3Jvc29m
// SIG // dCBUaW1lLVN0YW1wIFBDQSAyMDEwAhMzAAACAdFFWZgQ
// SIG // zEJPAAEAAAIBMA0GCWCGSAFlAwQCAQUAoIIBSjAaBgkq
// SIG // hkiG9w0BCQMxDQYLKoZIhvcNAQkQAQQwLwYJKoZIhvcN
// SIG // AQkEMSIEIL4atfAyul7bXjc4tLLmzabqEe5NrY/hZ9rR
// SIG // SS2CsVsPMIH6BgsqhkiG9w0BCRACLzGB6jCB5zCB5DCB
// SIG // vQQgWGuyOkyUEXJsdB2kk1mXSYKMHa5ffma69KSHah7X
// SIG // OCMwgZgwgYCkfjB8MQswCQYDVQQGEwJVUzETMBEGA1UE
// SIG // CBMKV2FzaGluZ3RvbjEQMA4GA1UEBxMHUmVkbW9uZDEe
// SIG // MBwGA1UEChMVTWljcm9zb2Z0IENvcnBvcmF0aW9uMSYw
// SIG // JAYDVQQDEx1NaWNyb3NvZnQgVGltZS1TdGFtcCBQQ0Eg
// SIG // MjAxMAITMwAAAgHRRVmYEMxCTwABAAACATAiBCAb6l6V
// SIG // AAK9/i++abF8I0NHmCnu2tqy8pGdaspzceZMWTANBgkq
// SIG // hkiG9w0BAQsFAASCAgBUEcn1n0v82tSXFJt9lxxJbLoR
// SIG // PO4kS8CTVX1NzgV1CyuBe8jISkcyEayj7Tg3vpx7lTMM
// SIG // oX76uk8MAgtZUKi8P6mwxB8EXhCwVBxqQ/SoEiB95A3n
// SIG // SCf5HfDYQZiF3Rqlze7hIuOKsuZFZUzU/ct5JUgNWplK
// SIG // g59MocvcGWbEdkYgpBVbCWFzXNt5PSQl1lX8IxwQsIY1
// SIG // 6UCXbul3+/tPb84X2KqnaxE6cKimxdLnGuDYxiC7CT16
// SIG // r9yEoKtobZ0SdQWeyiAH8sXzWrndnQfoiK0QMt+b24xR
// SIG // dXmy+RGpLghcSrmuIiQKhMQak/zZlYI84BSEmYvXp0Kx
// SIG // BdZ1wQEqesEJiV6tBeWNejNT9C39CE+uO5Vz84pgNfzZ
// SIG // Z03vybsoazkegMdOtJ8FrE+ecdB7uSdHHtyn2Yd76iTH
// SIG // ggmD3mMVc92RY+TktbH7om70EnYoyhb+ebzqZZcw5FsJ
// SIG // CUU2HTlUS5uDIfqpOKcn9kX0iD30FbIYwI/VA3RGRn/r
// SIG // OO1T21mIYlPATg8rA2NSEfS6sRF4oxP43YQGtsNhKE5e
// SIG // nNROnl3i3v6dsbEjs89uWhRqpWvH5bqQ5fOAl06lnEDf
// SIG // PoQcWqvQuSidhENzg0zvkfRwfdl7mxf9FZt1gPgeGhp0
// SIG // Cdc8Sf84CZnOhLXHbLh7DlVlPlJjorpDU83kJctAvw==
// SIG // End signature block
