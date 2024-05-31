import './styles.scss';
import 'bootstrap';
import onChange from 'on-change';
import * as yup from 'yup';
import i18next from 'i18next';
import resources from './locales/index';
import axios from 'axios';

// Initialize i18next instance for internationalization
const i18nInstance = i18next.createInstance();
i18nInstance.init({
  lng: 'ru',
  debug: false,
  resources,
});

// Function to generate unique IDs
const makeGenerateUniqueId = () => {
  let currentId = 0;
  return () => {
    currentId += 1;
    return `${currentId}`;
  };
};

const generatePostId = makeGenerateUniqueId();

// Function to parse feed object from the response
const parseFeedObject = (channelEl, response) => {
  const title = channelEl.querySelector('channel title').textContent;
  const description = channelEl.querySelector('channel description').textContent;
  const updatedAtString = channelEl.querySelector('channel lastBuildDate').textContent;
  const date = new Date(updatedAtString);
  const updatedAt = date.getTime();
  const url = response.data.status.url;

  return { title, description, updatedAt, url };
};

// Function to parse posts from the response
const parsePosts = (channelEl) => {
  const posts = [];

  channelEl.querySelectorAll('item').forEach((itemEl) => {
    const title = itemEl.querySelector('title').textContent;
    const description = itemEl.querySelector('description').textContent;
    const link = itemEl.querySelector('link').textContent;
    const updatedAtString = itemEl.querySelector('pubDate').textContent;
    const date = new Date(updatedAtString);
    const updatedAt = date.getTime();
    const postObject = { title, link, description, updatedAt };
    posts.push(postObject);
  });

  return posts;
};

// Function to parse the entire response
const parseResponse = (response) => {
  const parser = new DOMParser();
  const xml = parser.parseFromString(response.data.contents, 'application/xml');
  const channelEl = xml.querySelector('channel');

  const feed = parseFeedObject(channelEl, response);
  const posts = parsePosts(channelEl);

  return { feed, posts };
};

// Function to create a feed
const createFeed = (rssData, state) => {
  const url = rssData.feed.url;
  const isFeedExist = state.feeds.find((feed) => feed.url === url);

  if (!isFeedExist) {
    state.feeds.push({ url, updatedAt: 0 });
  }

  return state.feeds.find((feed) => feed.url === url);
};

// Function to update posts
const updatePosts = (rssData, feed, state) => {
  rssData.posts
    .filter((post) => post.updatedAt > feed.updatedAt)
    .forEach((post) => {
      state.posts.push({ ...post, id: generatePostId() });
    });

  state.changeState.posts += 1;
};

// Function to update feed
const updateFeed = (rssData, state) => {
  const feed = state.feeds.find((feed) => feed.url === rssData.feed.url);
  feed.title = feed.title ?? rssData.feed.title;
  feed.description = feed.description ?? rssData.feed.description;
  feed.updatedAt = rssData.feed.updatedAt;
  state.changeState.feeds += 1;
};

// Function to update feed and posts data
const updateFeedPostsData = (rssData, state) => {
  const feed = createFeed(rssData, state);
  updatePosts(rssData, feed, state);
  updateFeed(rssData, state);
};

// Function to crawl and update stream
const crawlAndUpdateStream = (streamUrl, state) =>
  axios(`https://allorigins.hexlet.app/get?disableCache=true&url=${streamUrl}`).then((response) => {
    const rssData = parseResponse(response);
    updateFeedPostsData(rssData, state);
  });

// Function to set crawling and updating stream
const setCrawlingAndUpdatingStream = (streamUrl, state) =>
  crawlAndUpdateStream(streamUrl, state).then(() =>
    setTimeout(() => setCrawlingAndUpdatingStream(streamUrl, state), 5000)
  );

// Function to render feeds
const renderFeeds = (state) => {
  const feeds = state.feeds;
  const feedsContainer = document.querySelector('.feeds');
  feedsContainer.innerHTML = '';

  const card = document.createElement('div');
  card.className = 'card border-0';
  card.setAttribute('bis_skin_checked', '1');

  const cardBody = document.createElement('div');
  cardBody.className = 'card-body';
  cardBody.setAttribute('bis_skin_checked', '1');

  const cardTitle = document.createElement('h2');
  cardTitle.className = 'card-title h4';
  cardTitle.textContent = i18nInstance.t('fields.feeds');

  cardBody.appendChild(cardTitle);
  card.appendChild(cardBody);

  const listGroup = document.createElement('ul');
  listGroup.className = 'list-group border-0 rounded-0';

  feeds.forEach((feed) => {
    const listItem = document.createElement('li');
    listItem.className = 'list-group-item border-0 border-end-0';

    const title = document.createElement('h3');
    title.className = 'h6 m-0';
    title.innerText = feed.title;

    const description = document.createElement('p');
    description.className = 'm-0 small text-black-50';
    description.textContent = feed.description;

    listItem.appendChild(title);
    listItem.appendChild(description);
    listGroup.appendChild(listItem);
  });

  card.appendChild(listGroup);
  feedsContainer.appendChild(card);
};

// Function to render posts
const renderPosts = (state) => {
  const posts = state.posts;
  const postsContainer = document.querySelector('.posts');
  postsContainer.innerHTML = '';

  const card = document.createElement('div');
  card.className = 'card border-0';
  card.setAttribute('bis_skin_checked', '1');

  const cardBody = document.createElement('div');
  cardBody.className = 'card-body';
  cardBody.setAttribute('bis_skin_checked', '1');

  const cardTitle = document.createElement('h2');
  cardTitle.className = 'card-title h4';
  cardTitle.textContent = i18nInstance.t('fields.posts');

  cardBody.appendChild(cardTitle);
  card.appendChild(cardBody);

  const listGroup = document.createElement('ul');
  listGroup.className = 'list-group border-0 rounded-0';

  posts.forEach((post) => {
    const listItem = document.createElement('li');
    listItem.className = 'list-group-item d-flex justify-content-between align-items-start border-0 border-end-0';

    const link = document.createElement('a');
    link.href = post.link;
    link.className = state.uiState.watchedPosts[post.id] ? 'fw-normal link-secondary' : 'fw-bold';
    link.dataset.id = post.id;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = post.title;
    link.addEventListener('click', () => {
      state.uiState.watchedPosts[post.id] = true;
      state.changeState.posts += 1;
    });

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'btn btn-outline-primary btn-sm';
    button.dataset.id = post.id;
    button.dataset.bsToggle = 'modal';
    button.dataset.bsTarget = '#modal';
    button.textContent = i18nInstance.t('fields.view');
    button.addEventListener('click', () => {
      state.uiState.watchedPosts[post.id] = true;
      state.changeState.posts += 1;
      state.uiState.modalData = post;
      state.changeState.modal += 1;
    });

    listItem.appendChild(link);
    listItem.appendChild(button);
    listGroup.appendChild(listItem);
  });

  card.appendChild(listGroup);
  postsContainer.appendChild(card);
};

// Function to render modal
const renderModal = (state) => {
  const post = state.uiState.modalData;
  const modal = document.querySelector('.modal-dialog');
  const modalTile = modal.querySelector('.modal-title');
  const modalBody = modal.querySelector('.modal-body');
  const modalReadContent = modal.querySelector('.full-article');

  modalTile.textContent = post.title;
  modalBody.textContent = post.description;
  modalReadContent.setAttribute('href', post.link);
};

// Main application function
const app = () => {
  const form = document.querySelector('.rss-form');
  const input = form.querySelector('input');
  const validationMessageEl = document.querySelector('.feedback');

  const state = {
    form: {
      isValid: null,
      validationMessageName: '',
    },
    changeState: {
      feeds: 0,
      posts: 0,
      modal: 0,
    },
    feeds: [],
    posts: [],
    uiState: {
      watchedPosts: {},
    },
  };

  const watchedState = onChange(state, (path) => {
    if (path === 'form.isValid' || path === 'form.validationMessageName') {
      renderForm(watchedState);
    } else if (path === 'changeState.posts') {
      renderPosts(watchedState);
    } else if (path === 'changeState.feeds') {
      renderFeeds(watchedState);
    } else if (path === 'changeState.modal') {
      renderModal(watchedState);
    }
  });

  // Function to render form
  const renderForm = (state) => {
    input.classList.remove('is-invalid');
    validationMessageEl.classList.remove('text-danger', 'text-success');
    validationMessageEl.textContent = '';

    if (state.form.isValid) {
      form.reset();
      validationMessageEl.classList.add('text-success');
    } else {
      input.classList.add('is-invalid');
      validationMessageEl.classList.add('text-danger');
    }
    validationMessageEl.textContent = i18nInstance.t(`validationMessages.${state.form.validationMessageName}`);
  };

  // Form submit event listener
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = new FormData(e.target);
    const urlSchema = yup.string().url();
    const validUrl = data.get('url');

    urlSchema
      .validate(validUrl)
      .then(() => {
        if (watchedState.feeds.some((feed) => feed.url === validUrl)) {
          const streamAlreadyExistsError = new Error();
          streamAlreadyExistsError.name = 'streamAlreadyExistsError';
          throw streamAlreadyExistsError;
        }
      })
      .then(() => crawlAndUpdateStream(validUrl, watchedState))
      .then(() => {
        watchedState.form.isValid = true;
        watchedState.form.validationMessageName = 'successMessage';
      })
      .then(() => {
        setCrawlingAndUpdatingStream(validUrl, watchedState);
      })
      .catch((error) => {
        watchedState.form.isValid = false;
        watchedState.form.validationMessageName = error.name;
      });
  });
};

app();
