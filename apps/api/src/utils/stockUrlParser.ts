export interface ParsedStockURL {
  site: string;
  id: string;
  url: string;
}

export function parseStockURL(url: string): ParsedStockURL | null {
  try {
    // Shutterstock Video
    if (/shutterstock.com(|\/[a-z]*)\/video\/clip-([0-9]*)/.test(url)) {
      const match = url.match(/shutterstock.com(|\/[a-z]*)\/video\/clip-([0-9]*)/);
      return { site: 'shutterstock', id: match![2], url };
    }

    // Shutterstock Music
    if (/shutterstock.com(.*)music\/(.*)track-([0-9]*)-/.test(url)) {
      const match = url.match(/shutterstock.com(.*)music\/(.*)track-([0-9]*)-/);
      return { site: 'shutterstock', id: match![3], url };
    }

    // Shutterstock Image (with description)
    if (/shutterstock\.com\/(.*)(image-vector|image-photo|image-illustration|image|image-generated|editorial)\/([0-9a-zA-Z-_]*)-([0-9a-z]*)/.test(url)) {
      const match = url.match(/shutterstock\.com\/(.*)(image-vector|image-photo|image-illustration|image|image-generated|editorial)\/([0-9a-zA-Z-_]*)-([0-9a-z]*)/);
      return { site: 'shutterstock', id: match![4], url };
    }

    // Shutterstock Image (without description)
    if (/shutterstock\.com\/(.*)(image-vector|image-photo|image-illustration|image-generated|editorial)\/([0-9a-z]*)/.test(url)) {
      const match = url.match(/shutterstock\.com\/(.*)(image-vector|image-photo|image-illustration|image-generated|editorial)\/([0-9a-z]*)/);
      return { site: 'shutterstock', id: match![3], url };
    }

    // Adobe Stock (images/templates/3d/video)
    if (/stock\.adobe.com\/(..\/||.....\/)(images|templates|3d-assets|stock-photo|video)\/([a-zA-Z0-9-%.,]*)\/([0-9]*)/.test(url)) {
      const match = url.match(/stock\.adobe.com\/(..\/||.....\/)(images|templates|3d-assets|stock-photo|video)\/([a-zA-Z0-9-%.,]*)\/([0-9]*)/);
      return { site: 'adobestock', id: match![4], url };
    }

    // Adobe Stock (asset_id parameter)
    if (/stock\.adobe.com(.*)asset_id=([0-9]*)/.test(url)) {
      const match = url.match(/stock\.adobe.com(.*)asset_id=([0-9]*)/);
      return { site: 'adobestock', id: match![2], url };
    }

    // Adobe Stock (audio search)
    if (/stock\.adobe.com\/(.*)search\/audio\?(k|keywords)=([0-9]*)/.test(url)) {
      const match = url.match(/stock\.adobe.com\/(.*)search\/audio\?(k|keywords)=([0-9]*)/);
      return { site: 'adobestock', id: match![3], url };
    }

    // Adobe Stock (direct ID)
    if (/stock\.adobe\.com\/(..\/||.....\/)([0-9]*)/.test(url)) {
      const match = url.match(/stock\.adobe\.com\/(..\/||.....\/)([0-9]*)/);
      return { site: 'adobestock', id: match![2], url };
    }

    // Depositphotos (jpg file)
    if (/depositphotos\.com(.*)depositphotos_([0-9]*)(.*)\.jpg/.test(url)) {
      const match = url.match(/depositphotos\.com(.*)depositphotos_([0-9]*)(.*)\.jpg/);
      return { site: 'depositphotos', id: match![2], url };
    }

    // Depositphotos (video)
    if (/depositphotos\.com\/([0-9]*)\/stock-video(.*)/.test(url)) {
      const match = url.match(/depositphotos\.com\/([0-9]*)\/stock-video(.*)/);
      return { site: 'depositphotos', id: match![1], url };
    }

    // Depositphotos (stock-photo/illustration/free-stock)
    if (/depositphotos\.com\/([0-9]*)\/(stock-photo|stock-illustration|free-stock)(.*)/.test(url)) {
      const match = url.match(/depositphotos\.com\/([0-9]*)\/(stock-photo|stock-illustration|free-stock)(.*)/);
      return { site: 'depositphotos', id: match![1], url };
    }

    // Depositphotos (qview parameter)
    if (/depositphotos.com(.*)qview=([0-9]*)/.test(url)) {
      const match = url.match(/depositphotos.com(.*)qview=([0-9]*)/);
      return { site: 'depositphotos', id: match![2], url };
    }

    // Depositphotos (photo/editorial/vector/illustration with ID)
    if (/depositphotos.com(.*)\/(photo|editorial|vector|illustration)\/([0-9a-z-]*)-([0-9]*)/.test(url)) {
      const match = url.match(/depositphotos.com(.*)\/(photo|editorial|vector|illustration)\/([0-9a-z-]*)-([0-9]*)/);
      return { site: 'depositphotos', id: match![4], url };
    }

    // 123RF (photo with ID)
    if (/123rf\.com\/(photo|free-photo)_([0-9]*)_/.test(url)) {
      const match = url.match(/123rf\.com\/(photo|free-photo)_([0-9]*)_/);
      return { site: '123rf', id: match![2], url };
    }

    // 123RF (mediapopup)
    if (/123rf\.com\/(.*)mediapopup=([0-9]*)/.test(url)) {
      const match = url.match(/123rf\.com\/(.*)mediapopup=([0-9]*)/);
      return { site: '123rf', id: match![2], url };
    }

    // 123RF (stock-photo)
    if (/123rf\.com\/stock-photo\/([0-9]*).html/.test(url)) {
      const match = url.match(/123rf\.com\/stock-photo\/([0-9]*).html/);
      return { site: '123rf', id: match![1], url };
    }

    // iStockPhoto
    if (/istockphoto\.com\/(.*)gm([0-9A-Z_]*)-/.test(url)) {
      const match = url.match(/istockphoto\.com\/(.*)gm([0-9A-Z_]*)-/);
      return { site: 'istockphoto', id: match![2], url };
    }

    // Getty Images
    if (/gettyimages\.com\/(.*)\/([0-9]*)/.test(url)) {
      const match = url.match(/gettyimages\.com\/(.*)\/([0-9]*)/);
      return { site: 'gettyimages', id: match![2], url };
    }

    // Freepik (video)
    if (/freepik.(.*)\/(.*)-?video-?(.*)\/([0-9a-z-]*)_([0-9]*)/.test(url)) {
      const match = url.match(/freepik.(.*)\/(.*)-?video-?(.*)\/([0-9a-z-]*)_([0-9]*)/);
      return { site: 'freepik', id: match![5], url };
    }

    // Freepik (image)
    if (/freepik\.(.*)(.*)_([0-9]*).htm/.test(url)) {
      const match = url.match(/freepik\.(.*)(.*)_([0-9]*).htm/);
      return { site: 'freepik', id: match![3], url };
    }

    // Flaticon (from freepik.com/icon)
    if (/freepik.com\/(icon|icone)\/(.*)_([0-9]*)/.test(url)) {
      const match = url.match(/freepik.com\/(icon|icone)\/(.*)_([0-9]*)/);
      return { site: 'flaticon', id: match![3], url };
    }

    // Flaticon
    if (/flaticon.com\/(.*)\/([0-9a-z-]*)_([0-9]*)/.test(url)) {
      const match = url.match(/flaticon.com\/(.*)\/([0-9a-z-]*)_([0-9]*)/);
      return { site: 'flaticon', id: match![3], url };
    }

    // Vecteezy
    if (/vecteezy.com\/([\/a-zA-Z-]*)\/([0-9]*)/.test(url)) {
      const match = url.match(/vecteezy.com\/([\/a-zA-Z-]*)\/([0-9]*)/);
      return { site: 'vecteezy', id: match![2], url };
    }

    // Envato Elements
    if (/elements\.envato\.com(.*)\/([0-9a-zA-Z-]*)-([0-9A-Z]*)/.test(url)) {
      const match = url.match(/elements\.envato\.com(.*)\/([0-9a-zA-Z-]*)-([0-9A-Z]*)/);
      return { site: 'envato', id: match![3], url };
    }

    return null;
  } catch (error) {
    console.error('Failed to parse stock URL:', error);
    return null;
  }
}
