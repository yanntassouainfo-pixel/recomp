// RECOMP pour macOS — fenêtre native (WKWebView) autour de la version en ligne.
// Les données (localStorage) restent sur ce Mac, dans le conteneur de l'app.
import Cocoa
import WebKit

let defaultURL = "https://recomp-ten-psi.vercel.app/app"
let startURL = URL(string: (Bundle.main.object(forInfoDictionaryKey: "RecompURL") as? String) ?? defaultURL)!
let appHost = startURL.host ?? ""

final class AppDelegate: NSObject, NSApplicationDelegate, WKNavigationDelegate, WKUIDelegate {
  var window: NSWindow!
  var web: WKWebView!

  func applicationDidFinishLaunching(_ notification: Notification) {
    buildMenu()
    let config = WKWebViewConfiguration()
    config.websiteDataStore = .default() // persistant : profil, mesures et réglages conservés
    config.preferences.setValue(true, forKey: "developerExtrasEnabled")
    web = WKWebView(frame: .zero, configuration: config)
    web.navigationDelegate = self
    web.uiDelegate = self
    web.allowsBackForwardNavigationGestures = true
    web.allowsMagnification = true

    window = NSWindow(contentRect: NSRect(x: 0, y: 0, width: 1240, height: 860),
                      styleMask: [.titled, .closable, .miniaturizable, .resizable, .fullSizeContentView],
                      backing: .buffered, defer: false)
    window.title = "RECOMP"
    window.titlebarAppearsTransparent = true
    window.minSize = NSSize(width: 380, height: 560)
    window.contentView = web
    window.setFrameAutosaveName("RECOMPMainWindow")
    if !window.setFrameUsingName("RECOMPMainWindow") { window.center() }
    window.makeKeyAndOrderFront(nil)
    web.load(URLRequest(url: startURL))
    NSApp.activate(ignoringOtherApps: true)
  }

  // Clic sur l'icône du Dock quand la fenêtre est fermée : on la rouvre.
  func applicationShouldHandleReopen(_ sender: NSApplication, hasVisibleWindows flag: Bool) -> Bool {
    if !flag { window.makeKeyAndOrderFront(nil) }
    return true
  }

  // Liens externes (crédits Unsplash, sources scientifiques…) : navigateur par défaut.
  func webView(_ webView: WKWebView, decidePolicyFor action: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
    if let url = action.request.url, let scheme = url.scheme, ["http", "https"].contains(scheme),
       url.host != appHost, action.targetFrame?.isMainFrame ?? true {
      NSWorkspace.shared.open(url); decisionHandler(.cancel); return
    }
    decisionHandler(.allow)
  }

  func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration, for action: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
    if let url = action.request.url {
      if url.host == appHost { webView.load(URLRequest(url: url)) } else { NSWorkspace.shared.open(url) }
    }
    return nil
  }

  // Sélecteur de fichiers (photos de suivi, import de programme).
  func webView(_ webView: WKWebView, runOpenPanelWith parameters: WKOpenPanelParameters, initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping ([URL]?) -> Void) {
    let panel = NSOpenPanel()
    panel.canChooseFiles = true
    panel.canChooseDirectories = false
    panel.allowsMultipleSelection = parameters.allowsMultipleSelection
    panel.beginSheetModal(for: window) { r in completionHandler(r == .OK ? panel.urls : nil) }
  }

  func webView(_ webView: WKWebView, runJavaScriptAlertPanelWithMessage message: String, initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping () -> Void) {
    let a = NSAlert(); a.messageText = message; a.addButton(withTitle: "OK"); a.runModal(); completionHandler()
  }

  func webView(_ webView: WKWebView, runJavaScriptConfirmPanelWithMessage message: String, initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping (Bool) -> Void) {
    let a = NSAlert(); a.messageText = message; a.addButton(withTitle: "OK"); a.addButton(withTitle: "Annuler")
    completionHandler(a.runModal() == .alertFirstButtonReturn)
  }

  // Export JSON des données (Profil → Exporter) : enregistré dans Téléchargements.
  func webView(_ webView: WKWebView, navigationAction: WKNavigationAction, didBecome download: WKDownload) { download.delegate = self }
  func webView(_ webView: WKWebView, navigationResponse: WKNavigationResponse, didBecome download: WKDownload) { download.delegate = self }

  func webView(_ webView: WKWebView, decidePolicyFor response: WKNavigationResponse, decisionHandler: @escaping (WKNavigationResponsePolicy) -> Void) {
    decisionHandler(response.canShowMIMEType ? .allow : .download)
  }

  func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
    let html = """
    <html><body style="font-family:-apple-system;background:#0e1012;color:#eee;display:flex;align-items:center;justify-content:center;height:100vh;margin:0">
    <div style="text-align:center;max-width:420px"><h2>RECOMP est hors ligne</h2>
    <p style="opacity:.7">Vérifie ta connexion internet puis appuie sur ⌘R.</p></div></body></html>
    """
    webView.loadHTMLString(html, baseURL: nil)
  }

  @objc func reload() { web.load(URLRequest(url: web.url?.host == appHost ? web.url! : startURL)) }
  @objc func goHome() { web.load(URLRequest(url: startURL)) }
  @objc func goBack() { web.goBack() }
  @objc func goForward() { web.goForward() }

  func buildMenu() {
    let main = NSMenu()
    let appItem = NSMenuItem(); main.addItem(appItem)
    let appMenu = NSMenu()
    appMenu.addItem(withTitle: "À propos de RECOMP", action: #selector(NSApplication.orderFrontStandardAboutPanel(_:)), keyEquivalent: "")
    appMenu.addItem(.separator())
    appMenu.addItem(withTitle: "Masquer RECOMP", action: #selector(NSApplication.hide(_:)), keyEquivalent: "h")
    appMenu.addItem(withTitle: "Quitter RECOMP", action: #selector(NSApplication.terminate(_:)), keyEquivalent: "q")
    appItem.submenu = appMenu

    let editItem = NSMenuItem(); main.addItem(editItem)
    let edit = NSMenu(title: "Édition")
    edit.addItem(withTitle: "Annuler", action: Selector(("undo:")), keyEquivalent: "z")
    edit.addItem(withTitle: "Rétablir", action: Selector(("redo:")), keyEquivalent: "Z")
    edit.addItem(.separator())
    edit.addItem(withTitle: "Couper", action: #selector(NSText.cut(_:)), keyEquivalent: "x")
    edit.addItem(withTitle: "Copier", action: #selector(NSText.copy(_:)), keyEquivalent: "c")
    edit.addItem(withTitle: "Coller", action: #selector(NSText.paste(_:)), keyEquivalent: "v")
    edit.addItem(withTitle: "Tout sélectionner", action: #selector(NSText.selectAll(_:)), keyEquivalent: "a")
    editItem.submenu = edit

    let viewItem = NSMenuItem(); main.addItem(viewItem)
    let view = NSMenu(title: "Présentation")
    view.addItem(withTitle: "Accueil", action: #selector(goHome), keyEquivalent: "1").target = self
    view.addItem(withTitle: "Recharger", action: #selector(reload), keyEquivalent: "r").target = self
    view.addItem(withTitle: "Précédent", action: #selector(goBack), keyEquivalent: "[").target = self
    view.addItem(withTitle: "Suivant", action: #selector(goForward), keyEquivalent: "]").target = self
    view.addItem(.separator())
    view.addItem(withTitle: "Plein écran", action: #selector(NSWindow.toggleFullScreen(_:)), keyEquivalent: "f").keyEquivalentModifierMask = [.command, .control]
    viewItem.submenu = view

    let winItem = NSMenuItem(); main.addItem(winItem)
    let win = NSMenu(title: "Fenêtre")
    win.addItem(withTitle: "Réduire", action: #selector(NSWindow.performMiniaturize(_:)), keyEquivalent: "m")
    win.addItem(withTitle: "Fermer", action: #selector(NSWindow.performClose(_:)), keyEquivalent: "w")
    winItem.submenu = win
    NSApp.windowsMenu = win
    NSApp.mainMenu = main
  }
}

extension AppDelegate: WKDownloadDelegate {
  func download(_ download: WKDownload, decideDestinationUsing response: URLResponse, suggestedFilename: String, completionHandler: @escaping (URL?) -> Void) {
    let dir = FileManager.default.urls(for: .downloadsDirectory, in: .userDomainMask).first!
    var dest = dir.appendingPathComponent(suggestedFilename)
    var i = 1
    while FileManager.default.fileExists(atPath: dest.path) {
      let base = (suggestedFilename as NSString).deletingPathExtension, ext = (suggestedFilename as NSString).pathExtension
      dest = dir.appendingPathComponent("\(base) \(i)" + (ext.isEmpty ? "" : ".\(ext)")); i += 1
    }
    completionHandler(dest)
  }
  func downloadDidFinish(_ download: WKDownload) {
    NSWorkspace.shared.activateFileViewerSelecting([FileManager.default.urls(for: .downloadsDirectory, in: .userDomainMask).first!])
  }
}

let app = NSApplication.shared
let delegate = AppDelegate()
app.delegate = delegate
app.setActivationPolicy(.regular)
app.run()
