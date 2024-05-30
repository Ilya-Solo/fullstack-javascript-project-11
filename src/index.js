import  './styles.scss';
import  'bootstrap';
import onChange from 'on-change';
import * as yup from 'yup';
import i18next from 'i18next';
import resources from './locales/index'
import axios from 'axios'

const i18nInstance = i18next.createInstance();
  i18nInstance.init({
    lng: 'ru',
    debug: false,
    resources
  })

const makeGenerateUniqueId = () => {
  let currentId = 0; // Initialize the counter
  return () => {
      currentId += 1; // Increment the counter by 1
      return `${currentId}`;
  };
};

const generatePostId = makeGenerateUniqueId();

const parseFeedObject = (channelEl, response) => {
  const title = channelEl.querySelector('channel title').textContent;
  const description = channelEl.querySelector('channel description').textContent;
  const updatedAtString =  channelEl.querySelector('channel lastBuildDate').textContent;
  const date = new Date(updatedAtString);
  const updatedAt = date.getTime();
  const url = response.data.status.url;

  return {title, description, updatedAt, url}  
}

const parsePosts = (channelEl) => {
  const posts = [];

  channelEl.querySelectorAll('item')
    .forEach((itemEl) => {
      const title = itemEl.querySelector('title').textContent;
      const description = itemEl.querySelector('description').textContent;
      const link = itemEl.querySelector('link').textContent;
      const updatedAtString =  itemEl.querySelector('pubDate').textContent;
      const date = new Date(updatedAtString);
      const updatedAt = date.getTime();
      const postObject = {title, link, description, updatedAt, id: generatePostId()};
      posts.push(postObject);
    })

  return posts;
}

const parseResponse = (response) => {
  const parser = new DOMParser();
  const xml = parser.parseFromString(response.data.contents, "application/xml");
  const channelEl = xml.querySelector('channel');

  const feed = parseFeedObject(channelEl, response);
  const posts = parsePosts(channelEl);

  
  return {feed, posts};
}

const createFeed = (rssData, state) => {
  const url = rssData.feed.url
  const isFeedExist = state.feeds.find((feed) => feed.url === url)
  
  if(!isFeedExist) {
    state.feeds.push({url, updatedAt: 0});
  }

  return state.feeds.find((feed) => feed.url === url);
}

const updatePosts = (rssData, feed, state) => {
  const posts = rssData.posts.filter((post) => post.updatedAt > feed.updatedAt);
  console.log(posts);
  console.log(rssData.posts);
  console.log(JSON.stringify(feed));
  rssData.posts.filter((post) => post.updatedAt > feed.updatedAt)
    .forEach((post) => {
      state.posts.push(post)
    })

  state.changeState.posts += 1;
}

const updateFeed = (rssData, state) => {
  const feed = state.feeds.find((feed) => feed.url === rssData.feed.url);
  feed.title = feed.title ?? rssData.feed.title;
  feed.description = feed.description ?? rssData.feed.description;
  feed.updatedAt = rssData.feed.updatedAt;
  console.log(JSON.stringify(feed));
  state.changeState.feeds += 1;
}

const updateFeedPostsData = (rssData, state) => {
  const feed = createFeed(rssData, state);
  updatePosts(rssData, feed, state);
  updateFeed(rssData, state);
}

const crawlAndUpdateStream = (streamUrl, state) => (
  axios(`https://allorigins.hexlet.app/get?url=${streamUrl}`)
    .then((response) => {
      const rssData = parseResponse(response);
      updateFeedPostsData(rssData, state)
    })
)

const setCrawlingAndUpdatingStream = (streamUrl, state) => (
  crawlAndUpdateStream(streamUrl, state)
    .then(() => setTimeout(() => setCrawlingAndUpdatingStream(streamUrl, state), 5000))
)

const renderFeeds = (state) => {
  const feeds = state.feeds;
  const feedsContainer = document.querySelector('.feeds')
  feedsContainer.innerHTML = ''

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
    listItem.className = "list-group-item border-0 border-end-0";

    const title = document.createElement('h3');
    title.className = 'h6 m-0';
    title.innerText = feed.title;

    const description = document.createElement('p');
    description.className = 'm-0 small text-black-50';
    description.textContent = feed.description;

    listItem.appendChild(title);
    listItem.appendChild(description);
    listGroup.appendChild(listItem);
  })

  card.appendChild(listGroup);

  feedsContainer.appendChild(card);
}

const renderPosts = (state) => {
  const posts = state.posts;
  const postsContainer = document.querySelector('.posts')
  postsContainer.innerHTML = ''

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

  posts.forEach(post => {
      const listItem = document.createElement('li');
      listItem.className = 'list-group-item d-flex justify-content-between align-items-start border-0 border-end-0';

      const link = document.createElement('a');
      link.href = post.link;
      link.className = 'fw-bold';
      link.dataset.id = post.id;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = post.title;

      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'btn btn-outline-primary btn-sm';
      button.dataset.id = post.id;
      button.dataset.bsToggle = 'modal';
      button.dataset.bsTarget = '#modal';
      button.textContent = i18nInstance.t('fields.view');

      listItem.appendChild(link);
      listItem.appendChild(button);
      listGroup.appendChild(listItem);
  });

  card.appendChild(listGroup);

  postsContainer.appendChild(card);
}

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
    },
    feeds: [],
    posts: [],
    uiState: {}
  }

  const watchedState = onChange(state, (path) => {
    if (path === "form.isValid" || path === "form.validationMessageName") {
      renderForm(watchedState);
    } else if (path === "changeState.posts") {
      renderPosts(watchedState);
    } else if (path === "changeState.feeds") {
      renderFeeds(watchedState);
    }
  })

  

  const renderForm = (state) => {
    input.classList.remove('is-invalid');
    validationMessageEl.classList.remove('text-danger', 'text-success');
    validationMessageEl.textContent = '';

    if(state.form.isValid) {
      form.reset();
      validationMessageEl.classList.add('text-success');
    } else {
      input.classList.add('is-invalid');
      validationMessageEl.classList.add('text-danger');
    }
    validationMessageEl.textContent = i18nInstance.t(`validationMessages.${state.form.validationMessageName}`);
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = new FormData(e.target);
    const urlSchema = yup.string().url();
    const validUrl = data.get('url')
    urlSchema.validate(validUrl)
      .then(() => {
        if (watchedState.feeds.filter((feed) => feed.url === validUrl).length !== 0) {
          const streamAlreadyExistsError = new Error();
          streamAlreadyExistsError.name = "streamAlreadyExistsError";
          throw streamAlreadyExistsError;
        }
      })
      .then(() => crawlAndUpdateStream(validUrl, watchedState))
      .then(() => {
        watchedState.form.isValid = true;
        watchedState.form.validationMessageName = 'successMessage';
      })
      .catch(error => {
        watchedState.form.isValid = false;
        watchedState.form.validationMessageName = error.name;
      }).then(() => {
        setCrawlingAndUpdatingStream(validUrl, watchedState);
      });

    
  })
}

app();