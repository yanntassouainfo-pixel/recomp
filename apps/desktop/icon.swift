// Génère l'icône 1024 px de RECOMP (dégradé teal → indigo, « R » blanc), fidèle au favicon du site.
import Cocoa
let size: CGFloat = 1024
let out = CommandLine.arguments[1]
let img = NSImage(size: NSSize(width: size, height: size))
img.lockFocus()
let inset: CGFloat = 100 // marge standard des icônes macOS
let rect = NSRect(x: inset, y: inset, width: size - 2 * inset, height: size - 2 * inset)
let shadow = NSShadow(); shadow.shadowColor = NSColor.black.withAlphaComponent(0.28); shadow.shadowBlurRadius = 28; shadow.shadowOffset = NSSize(width: 0, height: -12)
NSGraphicsContext.saveGraphicsState(); shadow.set()
let path = NSBezierPath(roundedRect: rect, xRadius: 185, yRadius: 185)
NSColor.black.setFill(); path.fill()
NSGraphicsContext.restoreGraphicsState()
let grad = NSGradient(starting: NSColor(srgbRed: 0x15/255, green: 0xA3/255, blue: 0x9A/255, alpha: 1),
                      ending: NSColor(srgbRed: 0x5B/255, green: 0x5F/255, blue: 0xEF/255, alpha: 1))!
grad.draw(in: path, angle: -45)
let font = NSFont.systemFont(ofSize: 520, weight: .heavy)
let attrs: [NSAttributedString.Key: Any] = [.font: font, .foregroundColor: NSColor.white]
let s = NSAttributedString(string: "R", attributes: attrs)
let b = s.size()
s.draw(at: NSPoint(x: (size - b.width) / 2, y: (size - b.height) / 2 + 6))
img.unlockFocus()
let rep = NSBitmapImageRep(data: img.tiffRepresentation!)!
try! rep.representation(using: .png, properties: [:])!.write(to: URL(fileURLWithPath: out))
