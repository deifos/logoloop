import Image from "next/image";
import { Link } from "@heroui/link";
import { XIcon } from "./icons/XIcon";
import { BuyMeACoffee } from "./BuyMeACoffee";

export function Footer() {
  return (
    <footer className="w-full border-t border-default-50 bg-default-50/30">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* Brand Column */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl font-bold text-foreground">
                LogoLoop
              </span>
            </div>
            <p className="text-sm text-default-600 mb-4 max-w-sm">
              Inspired on a video I saw on instagram.
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm text-default-500">Built by Vlad</span>
              <Image
                src="/vlad-pfp.jpg"
                alt="vlad pfp"
                width={24}
                height={24}
                className="w-6 h-6 rounded-full"
              />
              <Link
                isExternal
                className="flex items-center gap-1 text-default-500 hover:text-default-700 transition-colors"
                href="https://x.com/deifosv"
                title="Find me on X"
              >
                <XIcon className="w-4 h-4" />
              </Link>
              <BuyMeACoffee />
            </div>
          </div>

          {/* Other Projects Column */}
          <div></div>
          <div></div>
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">
              Other Projects
            </h3>
            <div className="space-y-2">
              <Link
                isExternal
                className="block text-sm text-default-600 hover:text-default-900 transition-colors"
                href="https://nostalgiapicturesai.com"
              >
                Nostalgia Pictures AI
              </Link>
              <Link
                isExternal
                className="block text-sm text-default-600 hover:text-default-900 transition-colors"
                href="https://prontoshoots.com"
              >
                Prontoshoots
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-6 border-t border-default-100">
          <div className="text-center">
            <p className="text-xs text-default-500">
              © {new Date().getFullYear()} LogoLoop. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
