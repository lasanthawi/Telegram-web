/*
 * https://github.com/morethanwords/tweb
 * Copyright (C) 2019-2021 Eduard Kuzmenko
 * https://github.com/morethanwords/tweb/blob/master/LICENSE
 */

import type LazyLoadQueue from './lazyLoadQueue';
import type {PeerPhotoSize} from '../lib/appManagers/appAvatarsManager';
import type {StoriesSegment, StoriesSegments} from '../lib/appManagers/appStoriesManager';
import {getMiddleware, type Middleware} from '../helpers/middleware';
import deferredPromise from '../helpers/cancellablePromise';
import {createSignal, createEffect, createMemo, onCleanup, JSX, createRoot, runWithOwner, getOwner, Show, untrack, Accessor} from 'solid-js';
import rootScope from '../lib/rootScope';
import {NULL_PEER_ID, REPLIES_PEER_ID} from '../lib/mtproto/mtproto_config';
import {Chat, ChatPhoto, User, UserProfilePhoto} from '../layer';
import getPeerColorById from '../lib/appManagers/utils/peers/getPeerColorById';
import getPeerPhoto from '../lib/appManagers/utils/peers/getPeerPhoto';
import wrapAbbreviation from '../lib/richTextProcessor/wrapAbbreviation';
import getPeerInitials from './wrappers/getPeerInitials';
import liteMode from '../helpers/liteMode';
import {renderImageFromUrlPromise} from '../helpers/dom/renderImageFromUrl';
import getPreviewURLFromBytes from '../helpers/bytes/getPreviewURLFromBytes';
import classNames from '../helpers/string/classNames';
import {wrapTopicIcon} from './wrappers/messageActionTextNewUnsafe';
import {Modify} from '../types';
import documentFragmentToNodes from '../helpers/dom/documentFragmentToNodes';
import DashedCircle, {DashedCircleSection} from '../helpers/canvas/dashedCircle';
import findUpClassName from '../helpers/dom/findUpClassName';
import {AckedResult} from '../lib/mtproto/superMessagePort';
import apiManagerProxy from '../lib/mtproto/mtprotoworker';
import callbackify from '../helpers/callbackify';
import Icon from './icon';

const FADE_IN_DURATION = 200;
const TEST_SWAPPING = 0;

const avatarsMap: Map<string, Set<ReturnType<typeof AvatarNew>>> = new Map();
const believeMe: Map<string, Set<ReturnType<typeof AvatarNew>>> = new Map();
const seen: Set<PeerId> = new Set();

function getAvatarQueueKey(peerId: PeerId, threadId?: number) {
  return peerId + (threadId ? '_' + threadId : '');
}

const onAvatarUpdate = ({peerId, threadId}: {peerId: PeerId, threadId?: number}) => {
  const key = getAvatarQueueKey(peerId, threadId);
  const set = avatarsMap.get(key);
  if(!set?.size) {
    return;
  }

  for(const avatar of set) {
    avatar.render();
  }
};

const onAvatarStoriesUpdate = ({peerId}: {peerId: PeerId}) => {
  const key = getAvatarQueueKey(peerId);
  const set = avatarsMap.get(key);
  if(!set?.size) {
    return;
  }

  for(const avatar of set) {
    avatar.updateStoriesSegments();
  }
};

rootScope.addEventListener('avatar_update', onAvatarUpdate);
rootScope.addEventListener('peer_title_edit', async(data) => {
  if(!(await rootScope.managers.appAvatarsManager.isAvatarCached(data.peerId))) {
    onAvatarUpdate(data);
  }
});

rootScope.addEventListener('user_stories', ({userId}) => {
  onAvatarStoriesUpdate({peerId: userId.toPeerId(false)});
});
rootScope.addEventListener('stories_read', onAvatarStoriesUpdate);
rootScope.addEventListener('story_deleted', onAvatarStoriesUpdate);
rootScope.addEventListener('story_new', onAvatarStoriesUpdate);

const getStoriesSegments = async(peerId: PeerId, storyId?: number): Promise<AckedResult<StoriesSegments>> => {
  if(storyId) {
    const storyUnreadType = await rootScope.managers.appStoriesManager.getUnreadType(peerId, storyId);

    const segments: StoriesSegments = [{
      length: 1,
      type: storyUnreadType
    }];

    return {
      cached: true,
      result: Promise.resolve(segments)
    };
  }

  return rootScope.managers.acknowledged.appStoriesManager.getPeerStoriesSegments(peerId);
};

const createUnreadGradient = (context: CanvasRenderingContext2D, size: number, dpr: number) => {
  const gradient = context.createLinearGradient(
    size * 0.9156 * dpr,
    size * -0.05695821429 * dpr,
    size * 0.1342364286 * dpr,
    size * 1.02370714286 * dpr
  );
  gradient.addColorStop(0, '#34C76F');
  gradient.addColorStop(1, '#3DA1FD');
  return gradient;
};

const createCloseGradient = (context: CanvasRenderingContext2D, size: number, dpr: number) => {
  const gradient = context.createLinearGradient(
    size * 0.5 * dpr,
    size * 0 * dpr,
    size * 0.5 * dpr,
    size * 1 * dpr
  );
  gradient.addColorStop(0, '#88D93A');
  gradient.addColorStop(1, '#30B73B');
  return gradient;
};

export function findUpAvatar(target: Element | EventTarget) {
  let avatar = findUpClassName(target, 'avatar');
  if(avatar) avatar = findUpClassName(avatar, 'has-stories') || avatar;
  return avatar;
}

const calculateSegmentsDimensions = (s: number) => {
  const willBeSize = Math.round(s * (1 - 6 / 54));
  const totalSvgSize = s * (1 + 2 / 54);
  const multiplier = s / 54;
  const strokeWidth = 2 * multiplier;

  return {
    size: s,
    willBeSize,
    totalSvgSize,
    multiplier,
    strokeWidth
  };
};

export const AvatarNew = (props: {
  peerId?: PeerId,
  threadId?: number,
  isDialog?: boolean,
  isBig?: boolean,
  peerTitle?: string,
  lazyLoadQueue?: LazyLoadQueue | false,
  wrapOptions?: WrapSomethingOptions,
  withStories?: boolean,
  storyId?: number,
  useCache?: boolean,
  size: number | 'full',
  props?: JSX.HTMLAttributes<HTMLDivElement>,
  storyColors?: Partial<{
    read: string
  }>
}) => {
  const [ready, setReady] = createSignal(false);
  const [icon, setIcon] = createSignal<Icon>();
  const [media, setMedia] = createSignal<JSX.Element>();
  const [thumb, setThumb] = createSignal<JSX.Element>();
  const [abbreviature, setAbbreviature] = createSignal<JSX.Element>();
  const [color, setColor] = createSignal<string>();
  const [isForum, setIsForum] = createSignal(false);
  const [isTopic, setIsTopic] = createSignal(false);
  const [storiesSegments, setStoriesSegments] = createSignal<StoriesSegments>();
  const [isStoryFolded, setIsStoryFolded] = createSignal<boolean>(false);
  const storyDimensions: Accessor<ReturnType<typeof calculateSegmentsDimensions>> = createMemo((previousDimensions) => {
    if(storiesSegments() === undefined) {
      return;
    }

    if(previousDimensions?.size === props.size) {
      return previousDimensions;
    }

    return calculateSegmentsDimensions(props.size as number);
  });
  const dashedCircleCanvas = createMemo(() => {
    // if(isStoryFolded()) {
    //   return;
    // }

    const dimensions = storyDimensions();
    if(!dimensions) {
      return;
    }

    const segmentToSection = (segment: StoriesSegment, unreadAsClose?: boolean): DashedCircleSection => {
      if(segment.type === 'read') {
        return {
          color: props.storyColors?.read || '#c4c9cc',
          length: segment.length,
          lineWidth: dimensions.strokeWidth / 2
        };
      }

      if(segment.type === 'close' || unreadAsClose) {
        return {
          color: closeGradient ??= createCloseGradient(context, canvas.width, dpr),
          length: segment.length,
          lineWidth: dimensions.strokeWidth
        };
      } else {
        return {
          color: unreadGradient ??= createUnreadGradient(context, canvas.width, dpr),
          length: segment.length,
          lineWidth: dimensions.strokeWidth
        };
      }
    };

    const dashedCircle = new DashedCircle();
    const {canvas, context, dpr} = dashedCircle;
    dashedCircle.prepare({
      radius: dimensions.size / 2,
      gap: 4 * dimensions.multiplier,
      width: dimensions.totalSvgSize,
      height: dimensions.totalSvgSize
    });

    let unreadGradient: CanvasGradient, closeGradient: CanvasGradient;
    canvas.style.setProperty('--offset', `${(dimensions.totalSvgSize - dimensions.size) / -2}px`);
    canvas.classList.add('avatar-stories-svg');

    createEffect(() => {
      const segments = storiesSegments();
      const folded = isStoryFolded();

      const firstCloseSegment = segments.find((segment) => segment.type === 'close');
      let sections: DashedCircleSection[];
      if(folded) {
        const segment = firstCloseSegment || segments.find((segment) => segment.type === 'unread') || segments[0];
        sections = [segmentToSection({length: 1, type: segment.type})];
      } else {
        sections = segments.map((segment) => segmentToSection(segment, !!firstCloseSegment));
      }

      dashedCircle.render(sections);
    });

    return canvas;
  });

  const readyPromise = deferredPromise<void>();
  const readyThumbPromise = deferredPromise<void>();
  const myId = rootScope.myId;
  const managers = rootScope.managers;
  const middlewareHelper = props.wrapOptions?.middleware ? props.wrapOptions.middleware.create() : getMiddleware();
  let addedToQueue = false, lastRenderPromise: ReturnType<typeof _render>;

  onCleanup(() => {
    lastRenderPromise = undefined;
    middlewareHelper.destroy();
    readyPromise.resolve();
    cleanLastKey();

    (props.lazyLoadQueue as LazyLoadQueue)?.delete({div: node});
  });

  // const owner = getOwner();

  const _setMedia = (media?: JSX.Element) => {
    setMedia(media);
    setReady(true);
    readyPromise.resolve();
    readyThumbPromise.resolve();
  };

  const _setThumb = (thumb?: JSX.Element) => {
    setThumb(thumb);
    setReady(true);
    readyThumbPromise.resolve();
  };

  const getKey = () => getAvatarQueueKey(props.peerId, props.threadId);
  const cleanLastKey = () => {
    if(!lastKey) {
      return;
    }

    const set = believeMe.get(lastKey);
    if(set) {
      set.delete(this);
      if(!set.size) {
        believeMe.delete(lastKey);
      }
    }

    const avatarsSet = avatarsMap.get(lastKey);
    if(!avatarsSet?.delete(ret)) {
      return;
    }

    if(!avatarsSet.size) {
      avatarsMap.delete(lastKey);
    }
  };

  const putAvatar = async(options: {
    photo: UserProfilePhoto.userProfilePhoto | ChatPhoto.chatPhoto,
    size: PeerPhotoSize,
    onlyThumb?: boolean
  }) => {
    const middleware = middlewareHelper.get();
    const {peerId, useCache} = props;
    const {photo, size} = options;
    const result = apiManagerProxy.loadAvatar(peerId, photo, size);
    const loadPromise = result;
    const cached = !(result instanceof Promise);

    const animate = !cached && liteMode.isAvailable('animations');
    let image: HTMLImageElement;
    const element = image = document.createElement('img');
    element.className = classNames('avatar-photo', animate && 'fade-in');

    let renderThumbPromise: Promise<void>;
    let callback: () => void;
    let thumbImage: HTMLImageElement, thumbElement: JSX.Element;
    if(cached) {
      callback = () => {
        if(!middleware()) {
          return;
        }

        _setMedia(element);
      };
    } else {
      if(size === 'photo_big') { // let's load small photo first
        const res = await putAvatar({photo, size: 'photo_small'});
        if(!middleware()) {
          return;
        }

        renderThumbPromise = res.loadThumbPromise || res.loadPromise;
        thumbImage = res.thumbImage;
      } else if(photo.stripped_thumb) {
        thumbElement = thumbImage = document.createElement('img');
        thumbImage.className = 'avatar-photo avatar-photo-thumbnail';
        const url = getPreviewURLFromBytes(photo.stripped_thumb);
        renderThumbPromise = renderImageFromUrlPromise(thumbImage, url).then(() => {
          if(media() || !middleware()) {
            return;
          }

          _setThumb(thumbElement);
        });
      }

      callback = () => {
        if(!middleware()) {
          return;
        }

        _setMedia(element);
        if(animate) {
          setTimeout(() => {
            image.classList.remove('fade-in');
            setThumb();
          }, animate ? FADE_IN_DURATION : 0);
        } else {
          setThumb();
        }
      };
    }

    const renderPromise = callbackify(loadPromise, (url) => {
      // let ii: HTMLImageElement;
      // const i = <img ref={ii} onLoad={() => {console.log('rendered lol', url)}} />;
      // const timeout = setTimeout(() => {
      //   console.warn('not rendered', {ii}, ii instanceof HTMLImageElement, url, ii.height);
      // }, 1e3);
      // renderImageFromUrlPromise(ii, url, useCache/* , !cached */).then(() => {
      //   console.log('rendered', url);
      //   clearTimeout(timeout);
      // });

      return renderImageFromUrlPromise(image, url, useCache/* , !cached */);
    }).then(() => callback());

    return {
      cached,
      loadPromise: renderPromise,
      loadThumbPromise: cached ? renderPromise : renderThumbPromise || Promise.resolve(),
      thumbImage,
      thumbElement,
      image,
      element
    };
  };

  const set = ({
    abbreviature,
    icon,
    color,
    isForum,
    isTopic,
    storiesSegments
  }: {
    abbreviature?: JSX.Element,
    icon?: Icon,
    color?: string,
    isForum?: boolean,
    isTopic?: boolean,
    storiesSegments?: StoriesSegments
  }) => {
    setThumb();
    setMedia();
    setIcon(icon);
    setAbbreviature(abbreviature);
    setColor(color);
    setIsForum(isForum);
    setIsTopic(isTopic);
    setStoriesSegments(storiesSegments);
  };

  const updateStoriesSegments = async() => {
    if(!props.withStories || (props.peerId === rootScope.myId && props.isDialog)) {
      return;
    }

    const segments = await (await getStoriesSegments(props.peerId, props.storyId)).result;
    if(lastRenderPromise) {
      const result = await lastRenderPromise;
      await result?.loadThumbPromise;
    }
    setStoriesSegments(segments);
  };

  const _render = async(onlyThumb?: boolean) => {
    const middleware = middlewareHelper.get();
    const {peerId, isDialog, withStories, storyId, isBig, peerTitle: title, threadId, wrapOptions} = props;
    if(peerId === myId && isDialog) {
      set({icon: 'saved'});
      return;
    }

    if(threadId) {
      const topic = await managers.dialogsStorage.getForumTopic(peerId, threadId);
      set({isTopic: true});

      return wrapTopicIcon({
        ...wrapOptions,
        middleware,
        topic,
        lazyLoadQueue: false
      }).then((icon) => {
        _setMedia(icon);
        return undefined as ReturnType<typeof putAvatar>;
      });
    }

    const peer = await apiManagerProxy.getPeer(peerId);
    if(!middleware()) {
      return;
    }

    if(peerId !== NULL_PEER_ID && peerId.isUser() && (peer as User.user)?.pFlags?.deleted) {
      set({color: 'archive', icon: 'deletedaccount'});
      return;
    }

    const _isForum = !!(peer as Chat.channel)?.pFlags?.forum;
    const storiesSegmentsResult = withStories && ((peer as User.user)?.stories_max_id || storyId) && await getStoriesSegments(peerId, storyId);
    const storiesSegments = storiesSegmentsResult?.cached ? await storiesSegmentsResult.result : undefined;
    if(!middleware()) {
      return;
    }

    const size: PeerPhotoSize = isBig ? 'photo_big' : 'photo_small';
    const photo = getPeerPhoto(peer);
    const avatarAvailable = !!photo;
    const avatarRendered = !!media();
    const isAvatarCached = avatarAvailable && apiManagerProxy.isAvatarCached(peerId, size);
    if(!middleware()) {
      return;
    }

    let isSet = false;
    if(!avatarRendered && !isAvatarCached) {
      let color = '';
      if(peerId && (peerId !== myId || !isDialog)) {
        color = getPeerColorById(peerId);
      }

      if(peerId === REPLIES_PEER_ID) {
        set({color, icon: 'reply_filled'});
        return;
      }

      const abbr = title ? wrapAbbreviation(title) : getPeerInitials(peer);
      set({
        abbreviature: documentFragmentToNodes(abbr),
        color,
        isForum: _isForum,
        storiesSegments
      });
      isSet = true;
      // return Promise.resolve(true);
    }

    if(storiesSegmentsResult && !storiesSegmentsResult.cached) {
      updateStoriesSegments();
    }

    if(avatarAvailable/*  && false */) {
      const promise = putAvatar({photo, size, onlyThumb});
      if(isSet) {
        return promise;
      }

      const changeSegments = !!storiesSegments;
      const changeForum = _isForum !== isForum();
      promise.then(({loadThumbPromise}) => loadThumbPromise).then(() => {
        if(!middleware()) {
          return;
        }

        if(changeSegments) {
          setStoriesSegments(storiesSegments);
        }

        if(changeForum) {
          setIsForum(_isForum);
        }

        if(TEST_SWAPPING && peerId === TEST_SWAPPING) {
          let i = true;
          setInterval(() => {
            i = !i;
            setStoriesSegments(i ? undefined : storiesSegments);
            console.log(media());
          }, 3e3);
        }
      });
      // recordPromise(promise, 'putAvatar-' + peerId);
      return promise;
    }
  };

  const processResult = (result: Awaited<ReturnType<typeof _render>>) => {
    if(!result && !isTopic()) {
      _setMedia();
    }

    lastRenderPromise = undefined;
    return result;
  };

  let lastKey: string;
  const render = async(_props?: Modify<typeof props, {size?: never, peerId?: PeerId}>) => {
    const key = getKey();
    if(key !== lastKey) {
      cleanLastKey();
      lastKey = key;

      let set = avatarsMap.get(key);
      if(!set) {
        avatarsMap.set(key, set = new Set());
      }
      set.add(ret);
    }

    if(_props) Object.assign(props, _props);
    middlewareHelper.clean();
    const middleware = middlewareHelper.get();

    if(props.lazyLoadQueue) {
      if(!seen.has(props.peerId)) {
        if(addedToQueue) return;
        addedToQueue = true;

        const key = getKey();
        let set = believeMe.get(key);
        if(!set) {
          believeMe.set(key, set = new Set());
        }

        set.add(ret);

        props.lazyLoadQueue.push({
          div: node,
          load: () => {
            seen.add(props.peerId);
            return render();
          }
        });

        const promise = lastRenderPromise = _render(true);
        const result = await promise;
        if(!middleware()) {
          return;
        }

        return processResult(result);
      } else if(addedToQueue) {
        props.lazyLoadQueue.delete({div: node});
      }
    }

    seen.add(props.peerId);

    const promise = lastRenderPromise = _render();

    const set = believeMe.get(key);
    if(set) {
      set.delete(ret);
      const arr = Array.from(set);
      believeMe.delete(key);

      for(let i = 0, length = arr.length; i < length; ++i) {
        arr[i].render();
      }
    }

    const result = await promise;
    if(!middleware()) {
      return;
    }

    if(addedToQueue) {
      addedToQueue = false;
    }

    return processResult(result);
  };

  const innerClassList = (): JSX.CustomAttributes<HTMLDivElement>['classList'] => {
    return {
      'is-forum': isForum(),
      'is-topic': isTopic(),
      'avatar-relative': !!thumb()
    };
  };

  const classList = (): JSX.CustomAttributes<HTMLDivElement>['classList'] => {
    return {
      ...(!dashedCircleCanvas() && innerClassList()),
      'has-stories': !!storyDimensions()
    };
  };

  const style = (): JSX.HTMLAttributes<HTMLDivElement>['style'] => {
    const dimensions = storyDimensions();
    return {
      'padding': dimensions ? (dimensions.size - dimensions.willBeSize) / 2 + 'px' : undefined,
      '--size': isTopic() && props.wrapOptions.customEmojiSize.width ? props.wrapOptions.customEmojiSize.width + 'px' : undefined
    };
  };

  const inner = (
    <>
      {icon() && Icon(icon(), 'avatar-icon', 'avatar-icon-' + icon())}
      {thumb()}
      {[media(), abbreviature()].find(Boolean)}
    </>
  );

  // ! if I remove first inner div, then it will be broken
  const wtf = (
    <Show when={storyDimensions()} fallback={inner}>
      <div>
        {dashedCircleCanvas()}
        <div
          class={`avatar avatar-like avatar-${storyDimensions().willBeSize}`}
          classList={innerClassList()}
          data-color={color()}
        >
          {inner}
        </div>
      </div>
    </Show>
  );

  let node: HTMLDivElement;
  const element = (
    <div
      ref={node}
      class={`avatar avatar-like avatar-${props.size}`}
      classList={classList()}
      data-color={color()}
      data-peer-id={props.peerId}
      data-story-id={props.storyId}
      style={style()}
      {...(props.props || {})}
    >
      {wtf}
    </div>
  );

  const ret = {
    element,
    ready,
    readyPromise,
    readyThumbPromise,
    node,
    render,
    setIsStoryFolded,
    setIcon,
    updateStoriesSegments
  };

  if(props.peerId !== undefined || props.peerTitle !== undefined) {
    render();
  }

  // let resolved = false;
  // readyThumbPromise.finally(() => {
  //   resolved = true;
  // });
  // setTimeout(() => {
  //   if(!resolved) {
  //     console.error('wtf');
  //     readyThumbPromise.resolve();
  //   }
  // }, 1e3);

  return ret;
};

export function avatarNew(props: {
  middleware: Middleware
} & Parameters<typeof AvatarNew>[0]) {
  return createRoot((dispose) => {
    props.middleware.onDestroy(dispose);
    (props.wrapOptions ??= {}).middleware = props.middleware;
    return AvatarNew(props);
  });
}