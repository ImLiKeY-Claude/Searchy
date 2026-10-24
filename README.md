# Searchy

### A better way to find your tools in Adobe After Effects.

Searchy is a dockable Adobe After Effects extension designed to make finding effects, plugin files, and animation presets more convenient. It combines a dedicated search interface with local file discovery and workflows for applying supported effects and presets.

Built to address a frustrating search-panel experience, Searchy provides an alternative place to find the tools you need without relying exclusively on After Effects' built-in search interface.

**Search less. Create more.**

---

## ✨ Features

### 🔎 Dedicated Search

Search for available tools from a single, dedicated panel.

Searchy uses multiple matching strategies to help find results, including:

- Exact matches
- Prefix matches
- Word-start matches
- Substring matches
- Multiword matching for names and filenames
- Searchable aliases, tags, and metadata where available

The search engine is designed to return useful results without requiring every query to match an item's complete name.

### 🎨 Host Effects

Browse and search effects exposed by After Effects through its host integration.

Searchy organizes results into a dedicated Host Effects section and provides an interaction for applying supported effects to selected layers.

### 🧩 Plugin File Discovery

Search for locally discovered After Effects plugin files.

Searchy can discover `.aex` files and display them in its Plug-in Files section, helping you locate plugin files by name.

**Important:** Finding a plugin file does not necessarily mean After Effects has successfully loaded that plugin or that it is available to apply.

### 🎞️ Animation Presets

Discover local After Effects animation preset files with the `.ffx` extension.

Searchy scans supported preset locations and displays discovered presets so they can be found and applied through the extension.

Preset availability and successful application depend on the preset, the After Effects environment, and the current selection.

### 📂 Organized Results

Search results are separated into three main sections:

1. **Presets**
2. **Plug-in Files**
3. **Host Effects**

The sections start collapsed to keep the interface organized. Sections containing matching results expand during a search.

Searchy also provides subtle parent-folder highlighting to help orient you within the results.

### 🖱️ Drag-and-Drop Interaction

Searchy supports drag-and-drop interactions within its panel.

The panel provides a dedicated way to interact with results, helping make browsing and selecting items more convenient.

### ⚡ Lightweight Search Architecture

Searchy uses a local search engine and local discovery logic rather than requiring a remote search service.

Its search-performance tests help track the responsiveness of the matching engine as the project evolves.

Actual performance depends on the available catalogue, local environment, and the work required to discover files.

---

## 📖 The Story Behind Searchy

**It started with a search bar that stopped doing its job.**

After Effects is a powerful creative tool, but working efficiently inside it often means navigating an ever-growing collection of effects, plugins, and presets. Finding the right tool should be one of the easiest parts of the workflow.

Then came the frustration.

The built-in After Effects Search panel began behaving unpredictably. Searching with alphabetic words could cause the panel to turn black, interrupting an otherwise normal workflow. Something as simple as looking for an effect became an obstacle instead of a shortcut.

Rather than accept that interruption as part of the experience, I wanted another way to find what I needed.

That idea became **Searchy**.

What started as an attempt to work around a frustrating search experience grew into a dedicated After Effects extension with its own search engine, local file discovery, organized results, and workflows for applying supported effects and presets.

The goal wasn't to reinvent After Effects. It was to make one everyday part of using it feel less frustrating.

Searchy is built around a simple principle:

> Spend less time searching for tools. Spend more time creating.

It's a practical solution to a real workflow problem.

---

## 🛠️ Technology Stack

Searchy is built using Adobe's CEP extension architecture and standard web technologies, with a host-side integration for interacting with After Effects.

| Technology | Role in Searchy |
|---|---|
| **Adobe CEP** | Provides the framework for running Searchy as a dockable extension panel inside Adobe applications. |
| **HTML** | Defines the panel's interface and document structure. |
| **CSS** | Controls the panel's layout, styling, and visual presentation. |
| **JavaScript** | Powers the interface, search engine, result organization, and local discovery logic. |
| **ExtendScript / JSX** | Provides the After Effects host-side integration used for communicating with the application and carrying out supported host operations. |
| **CEP manifest XML** | Defines extension identity, host compatibility, and panel configuration. |
| **Inno Setup** | Builds the Windows installer used to install Searchy into the current user's CEP extensions directory. |
| **JavaScript-based tests** | Test search behavior, result organization, discovery logic, panel behavior, and other project components. |

### How the parts fit together

**1. The panel**

The HTML, CSS, and JavaScript interface provides the search field, result sections, and user interactions.

**2. The search engine**

The client-side search engine matches queries against available searchable information and ranks matching results.

**3. Local discovery**

Discovery modules locate supported local plugin files and animation presets.

**4. The After Effects bridge**

The host-side JSX code provides the integration needed for supported operations inside After Effects.

**5. Packaging and installation**

The CEP manifest identifies the extension. The Windows installer places the runtime files in the user's CEP extension directory.

### Does Searchy require an online search service?

Searchy is designed around local discovery and client-side search. Its core search functionality does not require a remote search server.

---

## 🧠 How Search Works

Searchy uses several matching strategies to make results easier to find.

### Matching strategies

- **Exact matching:** Prioritizes a direct match with the query.
- **Prefix matching:** Finds names beginning with the query.
- **Word-start matching:** Helps find a word within a longer name.
- **Substring matching:** Finds a query appearing within a searchable string.
- **Multiword matching:** Supports queries whose words appear in different parts of an item's name or filename.

Aliases, tags, and metadata can also contribute to matching when those fields are available.

Search ranking helps order results so that stronger matches can appear before weaker ones.

The search engine is designed to work with a complete set of matches rather than arbitrarily displaying only the first limited batch of ranked results.

---

## 📦 Installation

### Option 1: Windows Installer — Recommended

1. Open the [Searchy Releases page](https://github.com/ImLiKeY-Claude/Searchy/releases).
2. Open the latest release.
3. Download **`Searchy-Setup-1.0.0.exe`**.
4. Run the installer and follow its instructions.
5. Restart After Effects if it is already open.
6. Open **Window → Extensions → Searchy**.

The installer places Searchy's extension files in the current user's CEP extensions directory. It does not need to install Searchy as a system-wide extension.

### Option 2: Manual Installation

1. Open the [Searchy Releases page](https://github.com/ImLiKeY-Claude/Searchy/releases).
2. Download **`Searchy-CEP-Extension.zip`**.
3. Extract the archive.
4. Copy the included `com.aeuniversalsearch.minimal` folder into:

   ```text
   %APPDATA%\Adobe\CEP\extensions\
   ```

5. Restart After Effects.
6. Open **Window → Extensions → Searchy**.

The resulting folder structure should look like this:

```text
CEP/
└── extensions/
    └── com.aeuniversalsearch.minimal/
        ├── CSXS/
        │   └── manifest.xml
        ├── client/
        │   ├── catalogue/
        │   └── search/
        ├── host.jsx
        └── index.html
```

### If Searchy Does Not Appear

CEP extensions may require CEP debug mode, depending on the installation and environment.

Searchy's development environment uses CEP 12. Do not enable debug mode unnecessarily if the extension already appears and works.

---

## 💻 Compatibility

Searchy was developed and verified in the following environment:

- **Application:** Adobe After Effects 2026
- **After Effects version tested:** 26.3
- **Extension framework:** Adobe CEP
- **CEP runtime:** 12.x
- **Operating system tested:** Windows 10 Pro, version 22H2

The Windows installer and the extension's functionality have been tested in this environment.

Other After Effects versions, operating systems, and CEP runtime combinations have not all been verified. Compatibility may vary depending on the installed version of After Effects, CEP support, plugin availability, and local file locations.

---

## 🧪 Testing and Quality

Searchy includes automated tests covering important parts of the project, including:

- Search matching and ranking
- Search performance
- Result-tree organization
- Local file discovery
- Effect discovery and application logic
- Host integration behavior
- Panel behavior
- UI syntax checks

Automated tests help catch regressions in the code, but they are not a substitute for testing inside After Effects.

The Windows installer has also passed an isolated installation and uninstallation test. The installed runtime files were verified against their expected SHA-256 hashes.

Searchy's installer and extension were subsequently installed and tested in a real After Effects environment.

Not every plugin, effect, preset, or third-party installation has been independently verified.

---

## 📁 Project Structure

The main source repository is organized into the following areas:

```text
Searchy/
├── CSXS/
│   └── manifest.xml
├── client/
│   ├── catalogue/
│   │   └── sampleCatalogue.js
│   └── search/
│       ├── effectDiscovery.js
│       ├── localDiscovery.js
│       ├── resultTree.js
│       └── searchEngine.js
├── tests/
├── host.jsx
├── index.html
├── CHANGELOG.md
├── HANDOVER.md
├── LICENSE
└── README.md
```

### Key components

| File or directory | Purpose |
|---|---|
| `CSXS/manifest.xml` | CEP extension configuration and host information. |
| `index.html` | Main panel document and interface entry point. |
| `host.jsx` | After Effects host-side integration. |
| `client/search/searchEngine.js` | Search matching and ranking logic. |
| `client/search/effectDiscovery.js` | Effect discovery logic. |
| `client/search/localDiscovery.js` | Local preset and plugin-file discovery. |
| `client/search/resultTree.js` | Organization and presentation of search results. |
| `tests/` | Automated tests for core functionality and regressions. |
| `CHANGELOG.md` | Project change history. |
| `HANDOVER.md` | Technical handover and project notes. |
| `LICENSE` | MIT license. |

The sample catalogue file is retained in the source tree for project compatibility and reference; it should not be assumed to be the live inventory of every installed effect or plugin.

---

## 🔒 Privacy and Local Data

Searchy's core search and local discovery features are designed to work with local data.

The project does not require a remote search server to perform its core matching operations.

Local plugin and preset discovery depends on files available in the user's environment. Finding a file does not guarantee that the file is valid, loaded, or compatible with the current After Effects installation.

---

## 🗺️ Project Direction

Searchy was created to solve a specific workflow problem: make finding After Effects tools more convenient when the built-in search experience becomes frustrating.

Future improvements may focus on:

- Improving search accuracy and result relevance
- Expanding compatibility testing
- Refining local discovery and result organization
- Improving reliability across different After Effects environments
- Making installation and troubleshooting easier

These are potential directions, not promises of features already implemented.

---

## 🤝 Contributing

Bug reports, suggestions, and carefully documented reproduction steps are welcome.

When reporting a problem, please include:

- Your After Effects version
- Your operating system
- The Searchy version
- The steps required to reproduce the issue
- What you expected to happen
- What actually happened

Please avoid including personal file paths, usernames, license information, or other private information in public issue reports.

---

## 📄 License

Searchy is released under the **MIT License**.

You may use, copy, modify, distribute, sublicense, and sell copies of the software, subject to the conditions of the license.

See [`LICENSE`](LICENSE) for the complete terms.

---

## 🙌 Final Note

Searchy exists because a small frustration can get in the way of creative work.

It is an independent project built to provide a practical alternative for finding effects, plugin files, and presets in Adobe After Effects.

If Searchy makes your workflow a little smoother, then it has achieved what it was created to do.

**Find your tools. Keep creating.**

---

**Repository:** [ImLiKeY-Claude/Searchy](https://github.com/ImLiKeY-Claude/Searchy)

**Downloads:** [Searchy Releases](https://github.com/ImLiKeY-Claude/Searchy/releases)
