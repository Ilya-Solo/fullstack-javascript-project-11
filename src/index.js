import  './styles.scss';
import  'bootstrap';
import onChange from 'on-change';
import * as yup from 'yup';
import i18next from 'i18next';
import resources from './locales/index'
import axios from 'axios'


const parseResponse = (response) => {
  const parser = new DOMParser();
  const xml = parser.parseFromString(response.data.contents, "application/xml");
  const channelEl = xml.querySelector('channel');

  const feedTitle = channelEl.querySelector('channel title').textContent;
  const feedDescription = channelEl.querySelector('channel description').textContent;
  const feedUpdatedAtString =  channelEl.querySelector('channel lastBuildDate').textContent;
  const feedDate = new Date(feedUpdatedAtString);
  const feedUpdatedAt = feedDate.getTime();

  const streamObject = {feed: {feedTitle, feedDescription, feedUpdatedAt}, posts: []}

  channelEl.querySelectorAll('item')
    .forEach((itemEl) => {
      const postName = itemEl.querySelector('title').textContent;
      const postDescription = itemEl.querySelector('description').textContent;
      const postLink = itemEl.querySelector('link').textContent;
      const postUpdatedAtString =  itemEl.querySelector('pubDate').textContent;
      const postDate = new Date(postUpdatedAtString);
      const postUpdatedAt = postDate.getTime();
      const postObject = {postName, postLink, postDescription, postUpdatedAt};
      streamObject.posts.push(postObject);
    })
  
  return streamObject;
}

const app = () => {
  const url = 'https://lorem-rss.hexlet.app/feed'
  
  axios(`https://allorigins.hexlet.app/get?url=${url}`)
    .then((response) => {
      const data = parseResponse(response);
      console.log(data)
    })
  const i18nInstance = i18next.createInstance();
  i18nInstance.init({
    lng: 'ru', // default language
    debug: false, // enables debug mode for development
    resources
  })

  const form = document.querySelector('.rss-form');
  const input = form.querySelector('input');
  const validationMessageEl = document.querySelector('.feedback');

  const state = {
    form: {
      isValid: null,
      validationMessageName: '',
    },
    streams: [],
    uiState: {}
  }

  const watchedState = onChange(state, (path, value, previousValue) => {
    if (path === "form.isValid" || path === "form.validationMessageName") {
      renderForm(watchedState);
    }

    // if (path === "form.streams") {
    //   renderStreamsList(watchedState);
    // }
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

  const renderStreamsList = (state) => {
    
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = new FormData(e.target);
    console.log(data.get('url'))
    const urlSchema = yup.string().url();
    const validUrl = data.get('url')
    urlSchema.validate(validUrl)
      .then(() => {
        if (watchedState.streams.includes(validUrl)) {
          const streamAlreadyExistsError = new Error();
          streamAlreadyExistsError.name = "streamAlreadyExistsError";

          throw streamAlreadyExistsError;
        }
      })
      .then(() => {
        watchedState.streams.push(validUrl);
        watchedState.form.isValid = true;
        watchedState.form.validationMessageName = 'successMessage';
      })
      .catch(error => {
        watchedState.form.isValid = false;
        watchedState.form.validationMessageName = error.name;
      });
  })
}

app();