function aeusJsonString(value) {
    var text = String(value == null ? "" : value);
    var output = '"';
    var i;
    var code;
    var ch;

    for (i = 0; i < text.length; i += 1) {
        ch = text.charAt(i);
        code = text.charCodeAt(i);
        if (ch === '"') output += '\\"';
        else if (ch === "\\") output += "\\\\";
        else if (code === 8) output += "\\b";
        else if (code === 9) output += "\\t";
        else if (code === 10) output += "\\n";
        else if (code === 12) output += "\\f";
        else if (code === 13) output += "\\r";
        else if (code < 32) output += "\\u" + ("0000" + code.toString(16)).slice(-4);
        else output += ch;
    }
    return output + '"';
}

function getHostStatus() {
    return "Connected to After Effects " + app.version;
}

function getEffectCatalogue() {
    var effects = [];
    var seen = {};
    var items = [];
    var i;
    var effect;
    var matchName;
    var displayName;
    var category;
    var version;
    var key;

    try {
        effects = app.effects;
        for (i = 0; i < effects.length; i += 1) {
            try {
                effect = effects[i];
                if (!effect) continue;
                matchName = String(effect.matchName || "");
                // A matchName is an identifier, not a user-facing label. Keep it separate.
                displayName = String(effect.displayName || "");
                category = String(effect.category || "");
                version = String(effect.version || "");
                key = matchName || (displayName + "#" + i);
                if (seen[key]) continue;
                seen[key] = true;
                items.push("{" +
                    '"id":' + aeusJsonString(key) + "," +
                    '"name":' + aeusJsonString(displayName) + "," +
                    '"displayName":' + aeusJsonString(displayName) + "," +
                    '"displayNameAvailable":' + (displayName ? "true" : "false") + "," +
                    '"matchName":' + aeusJsonString(matchName) + "," +
                    '"category":' + aeusJsonString(category) + "," +
                    '"version":' + aeusJsonString(version) + "," +
                    '"type":"effect","source":"After Effects app.effects",' +
                    '"discoveryStatus":"discovered",' +
                    '"hostListed":true,' +
                    '"availability":"not-verified",' +
                    '"applicability":"not-tested"' +
                "}");
            } catch (itemError) {
                // Ignore malformed individual entries but continue the inventory.
            }
        }
        return '{"ok":true,"source":"app.effects","hostVersion":' +
            aeusJsonString(app.version) + ',"count":' + items.length +
            ',"items":[' + items.join(",") + ']}';
    } catch (error) {
        return '{"ok":false,"source":"app.effects","error":' +
            aeusJsonString(error.toString()) + ',"items":[]}';
    }
}

function getApplyTargetStatus() {
    var active;
    var isComp = false;
    var selected = [];
    var names = [];
    var i;
    try {
        active = app.project ? app.project.activeItem : null;
        isComp = !!active && (active instanceof CompItem);
        if (isComp) {
            selected = active.selectedLayers || [];
            for (i = 0; i < selected.length; i += 1) names.push(aeusJsonString(String(selected[i].name || "Layer " + (i + 1))));
        }
        return '{"ok":true,"activeItemName":' + aeusJsonString(active ? String(active.name || "") : "") +
            ',"activeItemType":' + aeusJsonString(active ? String(active.typeName || "") : "") +
            ',"activeItemIsComp":' + (isComp ? "true" : "false") +
            ',"selectedLayerCount":' + (isComp ? selected.length : 0) +
            ',"selectedLayerNames":[' + names.join(",") + ']}';
    } catch (error) {
        return '{"ok":false,"error":' + aeusJsonString(error.toString()) + '}';
    }
}

// Searchy writes temporary drag diagnostics through CEP's filesystem API.
// Keep the log in the user's temp folder so it can be retrieved after testing.
function getSearchyDragDiagnosticLogPath() {
    try {
        return Folder.temp.fsName + "/Searchy-drag-diagnostics.jsonl";
    } catch (error) {
        return "";
    }
}

function applyEffectToSelectedLayers(effectMatchName) {
    var requestedMatchName = String(effectMatchName || "");
    var effects;
    var hostEffect = null;
    var i;
    var comp;
    var selected;
    var effectParade;
    var appliedCount = 0;
    var undoGroupOpen = false;
    var errorText;

    try {
        if (!requestedMatchName) {
            return '{"ok":false,"stage":"validation","error":"This result has no After Effects effect identifier and cannot be applied."}';
        }
        effects = app.effects;
        for (i = 0; i < effects.length; i += 1) {
            if (effects[i] && String(effects[i].matchName || "") === requestedMatchName) {
                hostEffect = effects[i];
                break;
            }
        }
        if (!hostEffect) {
            return '{"ok":false,"stage":"availability","error":"After Effects does not currently list this effect. Refresh the effect list and check that the plug-in is loaded."}';
        }
        if (!app.project || !app.project.activeItem || !(app.project.activeItem instanceof CompItem)) {
            return '{"ok":false,"stage":"selection","error":"Open a composition and select one or more layers first."}';
        }
        comp = app.project.activeItem;
        selected = comp.selectedLayers;
        if (!selected || selected.length === 0) {
            return '{"ok":false,"stage":"selection","error":"Select one or more layers in the active composition first."}';
        }

        app.beginUndoGroup("Searchy - Apply Effect");
        undoGroupOpen = true;
        try {
            for (i = 0; i < selected.length; i += 1) {
                effectParade = selected[i].property("ADBE Effect Parade");
                if (!effectParade || typeof effectParade.addProperty !== "function") {
                    throw new Error("The selected layer does not support effects.");
                }
                var addedEffect = effectParade.addProperty(requestedMatchName);
                if (!addedEffect || String(addedEffect.matchName || "") !== requestedMatchName) {
                    throw new Error("After Effects did not confirm that the requested effect was added to the layer.");
                }
                appliedCount += 1;
            }
        } finally {
            if (undoGroupOpen) {
                undoGroupOpen = false;
                app.endUndoGroup();
            }
        }
        return '{"ok":true,"stage":"apply-call","displayName":' + aeusJsonString(String(hostEffect.displayName || "")) +
            ',"matchName":' + aeusJsonString(requestedMatchName) +
            ',"appliedCount":' + appliedCount +
            ',"message":"After Effects added the effect to the selected layer(s). Inspect the composition to verify its visible result.","resultVerified":false}';
    } catch (error) {
        if (undoGroupOpen) {
            undoGroupOpen = false;
            try { app.endUndoGroup(); } catch (endError) {}
        }
        errorText = error && error.toString ? error.toString() : String(error);
        return '{"ok":false,"stage":"apply-call","appliedCount":' + appliedCount +
            ',"error":' + aeusJsonString(errorText) + ',"resultVerified":false}';
    }
}

function aeusFolderJson(folder, source) {
    return '{"path":' + aeusJsonString(folder.fsName) +
        ',"source":' + aeusJsonString(source) + '}';
}

function getLocalDiscoveryRoots() {
    var presetRoots = [];
    var pluginRoots = [];
    var appRoot;
    var documentsAdobe;
    var documentFolders;
    var folder;
    var userFolder;
    var i;
    var commonRoot;

    try {
        appRoot = Folder.appPackage;
        if (appRoot && appRoot.exists) {
            folder = Folder(appRoot.fsName + "/Presets");
            if (folder.exists) presetRoots.push(aeusFolderJson(folder, "After Effects install presets"));
            folder = Folder(appRoot.fsName + "/Plug-ins");
            if (folder.exists) pluginRoots.push(aeusFolderJson(folder, "After Effects install plug-ins"));

            if (appRoot.parent && appRoot.parent.parent) {
                commonRoot = Folder(appRoot.parent.parent.fsName + "/Common/Plug-ins");
                if (commonRoot.exists) pluginRoots.push(aeusFolderJson(commonRoot, "Adobe shared plug-ins"));
            }
        }

        documentsAdobe = Folder(Folder.myDocuments.fsName + "/Adobe");
        if (documentsAdobe.exists) {
            documentFolders = documentsAdobe.getFiles();
            for (i = 0; i < documentFolders.length; i += 1) {
                folder = documentFolders[i];
                if (!(folder instanceof Folder) || !/^After Effects/i.test(folder.name)) continue;
                userFolder = Folder(folder.fsName + "/User Presets");
                if (!userFolder.exists) userFolder = folder;
                presetRoots.push(aeusFolderJson(userFolder, "After Effects user presets"));
            }
        }
        return '{"ok":true,"presetRoots":[' + presetRoots.join(",") +
            '],"pluginRoots":[' + pluginRoots.join(",") + ']}';
    } catch (error) {
        return '{"ok":false,"error":' + aeusJsonString(error.toString()) +
            ',"presetRoots":[],"pluginRoots":[]}';
    }
}

function aeusWalkLocalFiles(folder, extension, source, items, seen, depth) {
    var entries;
    var entry;
    var key;
    var name;
    var uriName;
    var fullPath;
    var i;

    if (!folder || !folder.exists || depth > 32 || items.length >= 20000) return;
    entries = folder.getFiles();
    for (i = 0; i < entries.length && items.length < 20000; i += 1) {
        entry = entries[i];
        try {
            if (entry instanceof Folder) {
                if (entry.alias) continue;
                aeusWalkLocalFiles(entry, extension, source, items, seen, depth + 1);
                continue;
            }
            // File.name is the URI-encoded filename portion. Use displayName for
            // the human-readable filename; decode the URI name only as a fallback.
            uriName = String(entry.name || "");
            if (!new RegExp("\\." + extension + "$", "i").test(uriName)) continue;
            name = "";
            try { name = String(entry.displayName || ""); } catch (displayNameError) {}
            if (!name) {
                try {
                    name = typeof File.decode === "function" ? String(File.decode(uriName)) : uriName;
                } catch (decodeError) {
                    name = uriName;
                }
            }
            fullPath = String(entry.fsName || "");
            key = fullPath.toLowerCase();
            if (seen[key]) continue;
            seen[key] = true;
            items.push({
                id: key,
                name: name.replace(/\.[^.]+$/, ""),
                fileName: name,
                path: fullPath,
                source: source,
                type: extension === "ffx" ? "preset" : "plugin",
                availability: "file-present",
                applicationStatus: "not-tested"
            });
        } catch (entryError) {
            // Keep scanning the remaining entries if one item cannot be read.
        }
    }
}

function aeusCatalogueJson(items, extension) {
    var encoded = [];
    var item;
    var i;
    for (i = 0; i < items.length; i += 1) {
        item = items[i];
        encoded.push("{" +
            '"id":' + aeusJsonString(item.id) + "," +
            '"name":' + aeusJsonString(item.name) + "," +
            '"fileName":' + aeusJsonString(item.fileName) + "," +
            '"path":' + aeusJsonString(item.path) + "," +
            '"source":' + aeusJsonString(item.source) + "," +
            '"type":' + aeusJsonString(item.type) + "," +
            '"availability":"file-present",' +
            '"applicationStatus":"not-tested"' +
        "}");
    }
    return '{"ok":true,"extension":' + aeusJsonString(extension) +
        ',"count":' + encoded.length + ',"items":[' + encoded.join(",") + ']}';
}

function scanLocalPresetFolder(folderPath, source) {
    var items = [];
    var folder;
    try {
        folder = Folder(folderPath);
        if (!folder.exists) return '{"ok":false,"error":"Preset folder not found.","items":[]}';
        aeusWalkLocalFiles(folder, "ffx", String(source || "Custom preset folder"), items, {}, 0);
        return aeusCatalogueJson(items, "ffx");
    } catch (error) {
        return '{"ok":false,"error":' + aeusJsonString(error.toString()) + ',"items":[]}';
    }
}

function scanLocalPluginFolder(folderPath, source) {
    var items = [];
    var folder;
    try {
        folder = Folder(folderPath);
        if (!folder.exists) return '{"ok":false,"error":"Plug-in folder not found.","items":[]}';
        aeusWalkLocalFiles(folder, "aex", String(source || "Plug-in folder"), items, {}, 0);
        return aeusCatalogueJson(items, "aex");
    } catch (error) {
        return '{"ok":false,"error":' + aeusJsonString(error.toString()) + ',"items":[]}';
    }
}

function applyPresetToSelectedLayers(presetPath) {
    var preset;
    var comp;
    var selected;
    var message;
    var succeeded = false;
    var undoGroupOpen = false;

    try {
        preset = File(String(presetPath || ""));
        if (!/\.ffx$/i.test(preset.name)) {
            return '{"ok":false,"stage":"validation","error":"Choose an .ffx animation preset file."}';
        }
        if (!preset.exists) {
            return '{"ok":false,"stage":"validation","error":"The preset file is no longer present at that path."}';
        }
        if (!app.project || !app.project.activeItem || !(app.project.activeItem instanceof CompItem)) {
            return '{"ok":false,"stage":"validation","error":"Open a composition and select one or more layers first."}';
        }
        comp = app.project.activeItem;
        selected = comp.selectedLayers;
        if (!selected || selected.length === 0) {
            return '{"ok":false,"stage":"validation","error":"Select one or more layers in the active composition first."}';
        }

        app.beginUndoGroup("Searchy - Apply Preset");
        undoGroupOpen = true;
        try {
            selected[0].applyPreset(preset);
            succeeded = true;
        } finally {
            if (undoGroupOpen) {
                undoGroupOpen = false;
                app.endUndoGroup();
            }
        }
        message = succeeded ? "After Effects completed the applyPreset call. Inspect the selected layers to verify the result." : "After Effects did not confirm the preset application.";
        return '{"ok":' + (succeeded ? "true" : "false") +
            ',"stage":"apply-call","message":' + aeusJsonString(message) +
            ',"resultVerified":false}';
    } catch (error) {
        if (undoGroupOpen) {
            undoGroupOpen = false;
            try { app.endUndoGroup(); } catch (endError) {}
        }
        return '{"ok":false,"stage":"apply-call","error":' + aeusJsonString(error.toString()) +
            ',"resultVerified":false}';
    }
}
