'use strict';

document.addEventListener('DOMContentLoaded', () => {
  // Je récupère la galerie une fois que la page est chargée
  const gallery = document.querySelector('.gallery');

  if (!gallery) {
    return;
  }

  // Je récupère toutes les images de la galerie
  const items = Array.from(gallery.querySelectorAll('.gallery-item'));

  if (items.length === 0) {
    gallery.style.removeProperty('display');
    return;
  }

  // Je récupère les différentes catégories sans doublons
  const tags = [
    ...new Set(
      items
        .map((item) => item.dataset.galleryTag)
        .filter(Boolean)
    ),
  ];

  // Je crée la ligne Bootstrap qui va contenir les images
  const row = document.createElement('div');
  row.className = 'gallery-items-row row';

  items.forEach((item) => {
    item.classList.add('img-fluid');

    const column = document.createElement('div');
    column.className =
      'item-column mb-4 col-12 col-sm-6 col-md-4 col-lg-4 col-xl-4';

    column.appendChild(item);
    row.appendChild(column);
  });

  // Je crée la barre des filtres
  const tagsBar = document.createElement('ul');
  tagsBar.className = 'my-4 tags-bar nav nav-pills';
  tagsBar.setAttribute('aria-label', 'Filtres de la galerie');

  // Cette fonction évite de répéter le même code pour chaque filtre
  const createTagButton = (label, value, active = false) => {
    const listItem = document.createElement('li');
    listItem.className = 'nav-item';

    const button = document.createElement('button');
    button.type = 'button';
    button.className = `nav-link${active ? ' active active-tag' : ''}`;
    button.dataset.imagesToggle = value;
    button.textContent = label;
    button.setAttribute('aria-pressed', active ? 'true' : 'false');

    listItem.appendChild(button);

    return listItem;
  };

  // Le filtre "Tous" est actif au chargement
  tagsBar.appendChild(createTagButton('Tous', 'all', true));

  tags.forEach((tag) => {
    tagsBar.appendChild(createTagButton(tag, tag));
  });

  gallery.prepend(tagsBar);
  gallery.appendChild(row);

  // Je crée la fenêtre qui permet d'afficher une image en grand
  const lightbox = document.createElement('div');
  lightbox.className = 'modal fade';
  lightbox.id = 'myAwesomeLightbox';
  lightbox.tabIndex = -1;
  lightbox.setAttribute('aria-hidden', 'true');

  lightbox.innerHTML = `
    <div class="modal-dialog" role="document">
      <div class="modal-content">
        <div class="modal-body position-relative">

          <button
            type="button"
            class="mg-prev"
            aria-label="Image précédente"
            style="cursor:pointer;position:absolute;top:50%;left:-15px;background:white;border:0;z-index:1;"
          >
            &lt;
          </button>

          <img
            class="lightboxImage img-fluid"
            alt=""
          >

          <button
            type="button"
            class="mg-next"
            aria-label="Image suivante"
            style="cursor:pointer;position:absolute;top:50%;right:-15px;background:white;border:0;z-index:1;"
          >
            &gt;
          </button>

        </div>
      </div>
    </div>
  `;

  gallery.appendChild(lightbox);

  const lightboxImage = lightbox.querySelector('.lightboxImage');
  const previousButton = lightbox.querySelector('.mg-prev');
  const nextButton = lightbox.querySelector('.mg-next');

  // Bootstrap gère l'ouverture et la fermeture de la fenêtre
  const modal =
    typeof bootstrap !== 'undefined'
      ? new bootstrap.Modal(lightbox)
      : null;

  let activeImage = null;

  // Je récupère le filtre actuellement sélectionné
  const getActiveTag = () => {
    return (
      gallery.querySelector('.tags-bar .active-tag')
        ?.dataset.imagesToggle ?? 'all'
    );
  };

  // Je récupère uniquement les images du filtre actif
  const getFilteredItems = () => {
    const activeTag = getActiveTag();

    return items.filter((item) => {
      return (
        activeTag === 'all' ||
        item.dataset.galleryTag === activeTag
      );
    });
  };

  // Je place l'image choisie dans la lightbox
  const displayInLightbox = (item) => {
    if (!item || !lightboxImage) {
      return;
    }

    activeImage = item;

    lightboxImage.src = item.currentSrc || item.src;
    lightboxImage.alt =
      item.alt || 'Photographie de la galerie';
  };

  const openLightbox = (item) => {
    displayInLightbox(item);

    if (modal) {
      modal.show();
    }
  };

  // Cette fonction permet de passer à l'image suivante ou précédente
  const navigate = (direction) => {
    const visibleItems = getFilteredItems();

    if (visibleItems.length === 0) {
      return;
    }

    let index = visibleItems.indexOf(activeImage);

    if (index === -1) {
      index = 0;
    }

    // Le modulo permet de revenir au début après la dernière image
    const nextIndex =
      (index + direction + visibleItems.length) %
      visibleItems.length;

    displayInLightbox(visibleItems[nextIndex]);
  };

  // Chaque image peut être ouverte à la souris ou au clavier
  items.forEach((item) => {
    item.tabIndex = 0;
    item.setAttribute('role', 'button');

    item.addEventListener('click', () => {
      openLightbox(item);
    });

    item.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openLightbox(item);
      }
    });
  });

  // Gestion des filtres de la galerie
  tagsBar.addEventListener('click', (event) => {
    const button = event.target.closest(
      '[data-images-toggle]'
    );

    if (!button) {
      return;
    }

    // Je mets à jour le bouton actif
    tagsBar
      .querySelectorAll('[data-images-toggle]')
      .forEach((tagButton) => {
        const isActive = tagButton === button;

        tagButton.classList.toggle('active', isActive);
        tagButton.classList.toggle(
          'active-tag',
          isActive
        );

        tagButton.setAttribute(
          'aria-pressed',
          isActive ? 'true' : 'false'
        );
      });

    const selectedTag = button.dataset.imagesToggle;

    // Je masque les images qui ne correspondent pas au filtre
    items.forEach((item) => {
      const column = item.closest('.item-column');

      const shouldShow =
        selectedTag === 'all' ||
        item.dataset.galleryTag === selectedTag;

      if (column) {
        column.hidden = !shouldShow;
      }
    });
  });

  previousButton?.addEventListener('click', () => {
    navigate(-1);
  });

  nextButton?.addEventListener('click', () => {
    navigate(1);
  });

  // Les flèches du clavier permettent aussi de changer de photo
  document.addEventListener('keydown', (event) => {
    if (!lightbox.classList.contains('show')) {
      return;
    }

    if (event.key === 'ArrowLeft') {
      navigate(-1);
    }

    if (event.key === 'ArrowRight') {
      navigate(1);
    }
  });

  // La galerie était cachée pendant son initialisation
  gallery.style.removeProperty('display');
});