/* =========================================================
   MOVIE DATA
========================================================= */

/*
    Later replace this with:

    fetch("/api/movies")

    Your actual JSON structure is:

    {
        movie: {
            title,
            year
        },

        director: {
            name
        },

        actors: [],

        genres: [],

        themes: [],

        awards: []
    }
*/

const movies = [
    {
        movie: {
            title: 'Movie 0001',
            year: 1993,
        },

        director: {
            name: 'James Cameron',
        },

        actors: ['Zendaya', 'Natalie Portman', 'Matthew McConaughey'],

        genres: ['Psychological Thriller'],

        themes: ['Technology', 'Power', 'Corruption', 'Time'],

        awards: [],
    },

    {
        movie: {
            title: 'Movie 0002',
            year: 2001,
        },

        director: {
            name: 'Christopher Nolan',
        },

        actors: ['Leonardo DiCaprio', 'Tom Hardy'],

        genres: ['Sci-Fi', 'Thriller'],

        themes: ['Dreams', 'Reality', 'Time'],

        awards: [
            {
                name: 'Oscar',
                category: 'Best Picture',
            },
        ],
    },

    {
        movie: {
            title: 'Movie 0003',
            year: 2010,
        },

        director: {
            name: 'Denis Villeneuve',
        },

        actors: ['Matthew McConaughey', 'Anne Hathaway'],

        genres: ['Sci-Fi', 'Drama'],

        themes: ['Space', 'Time', 'Humanity'],

        awards: [],
    },

    {
        movie: {
            title: 'Movie 0004',
            year: 2014,
        },

        director: {
            name: 'Christopher Nolan',
        },

        actors: ['Leonardo DiCaprio', 'Tom Hardy'],

        genres: ['Action', 'Sci-Fi'],

        themes: ['Technology', 'Dreams', 'Reality'],

        awards: [],
    },

    {
        movie: {
            title: 'Movie 0005',
            year: 2018,
        },

        director: {
            name: 'James Cameron',
        },

        actors: ['Zendaya', 'Tom Hardy'],

        genres: ['Action', 'Thriller'],

        themes: ['Power', 'Corruption'],

        awards: [],
    },

    {
        movie: {
            title: 'Movie 0006',
            year: 2020,
        },

        director: {
            name: 'Denis Villeneuve',
        },

        actors: ['Zendaya', 'Timothée Chalamet'],

        genres: ['Sci-Fi', 'Adventure'],

        themes: ['Power', 'Politics', 'Survival'],

        awards: [],
    },
];

/* =========================================================
   DOM ELEMENTS
========================================================= */

const movieGrid = document.getElementById('movieGrid');

const movieCount = document.getElementById('movieCount');

const homeView = document.getElementById('homeView');

const movieView = document.getElementById('movieView');

const searchView = document.getElementById('searchView');

const movieDetails = document.getElementById('movieDetails');

const similarMovies = document.getElementById('similarMovies');

const searchInput = document.getElementById('searchInput');

const searchButton = document.getElementById('searchButton');

const searchResults = document.getElementById('searchResults');

const searchAnswer = document.getElementById('searchAnswer');

const searchQueryText = document.getElementById('searchQueryText');

const loading = document.getElementById('loading');

/* =========================================================
   INITIALIZATION
========================================================= */

function init() {
    renderMovies(movies);

    movieCount.textContent = `${movies.length} movies`;
}

init();

/* =========================================================
   RENDER MOVIE CARDS
========================================================= */

function renderMovies(movieList, container = movieGrid) {
    container.innerHTML = '';

    if (!movieList.length) {
        container.innerHTML = `
            <div class="search-answer">
                No movies found.
            </div>
        `;

        return;
    }

    movieList.forEach((movie) => {
        const card = createMovieCard(movie);

        container.appendChild(card);
    });
}

/* =========================================================
   CREATE MOVIE CARD
========================================================= */

function createMovieCard(movie) {
    const card = document.createElement('article');

    card.className = 'movie-card';

    const title = movie.movie.title;

    const year = movie.movie.year;

    const director = movie.director?.name || 'Unknown';

    const genres = movie.genres || [];

    card.innerHTML = `

        <div class="movie-poster">

            <span class="poster-letter">
                ${getPosterLetter(title)}
            </span>

            <span class="movie-year">
                ${year}
            </span>

        </div>


        <div class="movie-card-content">

            <div class="movie-title">
                ${escapeHTML(title)}
            </div>

            <div class="movie-director">
                Directed by ${escapeHTML(director)}
            </div>


            <div class="genre-list">

                ${genres
                    .slice(0, 2)
                    .map(
                        (genre) =>
                            `
                            <span class="genre-tag">
                                ${escapeHTML(genre)}
                            </span>
                            `,
                    )
                    .join('')}

            </div>

        </div>
    `;

    card.addEventListener('click', () => openMovie(movie));

    return card;
}

/* =========================================================
   OPEN MOVIE
========================================================= */

function openMovie(movie) {
    homeView.classList.add('hidden');

    searchView.classList.add('hidden');

    movieView.classList.remove('hidden');

    renderMovieDetails(movie);

    /*
        For now we calculate similar movies locally.

        Later replace this with:

        fetch(`/api/movies/${movie.movie.title}/similar`)
    */

    const similar = findSimilarMovies(movie);

    renderMovies(similar, similarMovies);

    window.scrollTo({
        top: 0,
        behavior: 'smooth',
    });
}

/* =========================================================
   MOVIE DETAILS
========================================================= */

function renderMovieDetails(movie) {
    const title = movie.movie.title;

    const year = movie.movie.year;

    const director = movie.director?.name || 'Unknown';

    const actors = movie.actors || [];

    const genres = movie.genres || [];

    const themes = movie.themes || [];

    const awards = movie.awards || [];

    movieDetails.innerHTML = `

        <div class="movie-detail-layout">


            <div class="detail-poster">

                ${getPosterLetter(title)}

            </div>


            <div class="detail-info">

                <h1>
                    ${escapeHTML(title)}
                </h1>

                <span class="detail-year">
                    ${year}
                </span>


                <div class="detail-section">

                    <h3>
                        Director
                    </h3>

                    <p>
                        ${escapeHTML(director)}
                    </p>

                </div>


                <div class="detail-section">

                    <h3>
                        Genres
                    </h3>

                    <div class="chips">

                        ${genres
                            .map(
                                (genre) =>
                                    `
                                        <span class="chip">
                                            ${escapeHTML(genre)}
                                        </span>
                                        `,
                            )
                            .join('')}

                    </div>

                </div>


                <div class="detail-section">

                    <h3>
                        Actors
                    </h3>

                    <div class="chips">

                        ${actors
                            .map(
                                (actor) =>
                                    `
                                        <span class="chip">
                                            ${escapeHTML(actor)}
                                        </span>
                                        `,
                            )
                            .join('')}

                    </div>

                </div>


                <div class="detail-section">

                    <h3>
                        Themes
                    </h3>

                    <div class="chips">

                        ${themes
                            .map(
                                (theme) =>
                                    `
                                        <span class="chip">
                                            ${escapeHTML(theme)}
                                        </span>
                                        `,
                            )
                            .join('')}

                    </div>

                </div>


                ${
                    awards.length
                        ? `
                            <div class="detail-section">

                                <h3>
                                    Awards
                                </h3>

                                <div class="chips">

                                    ${awards
                                        .map(
                                            (award) =>
                                                `
                                                    <span class="chip">
                                                        ${escapeHTML(
                                                            formatAward(award),
                                                        )}
                                                    </span>
                                                    `,
                                        )
                                        .join('')}

                                </div>

                            </div>
                        `
                        : ''
                }

            </div>

        </div>
    `;
}

/* =========================================================
   FIND SIMILAR MOVIES
========================================================= */

function findSimilarMovies(sourceMovie) {
    const sourceGenres = sourceMovie.genres || [];

    const sourceThemes = sourceMovie.themes || [];

    const sourceActors = sourceMovie.actors || [];

    return movies

        .filter((movie) => movie.movie.title !== sourceMovie.movie.title)

        .map((movie) => {
            let score = 0;

            /*
                Genre similarity
            */

            movie.genres.forEach((genre) => {
                if (sourceGenres.includes(genre)) {
                    score += 5;
                }
            });

            /*
                Theme similarity
            */

            movie.themes.forEach((theme) => {
                if (sourceThemes.includes(theme)) {
                    score += 3;
                }
            });

            /*
                Actor similarity
            */

            movie.actors.forEach((actor) => {
                if (sourceActors.includes(actor)) {
                    score += 2;
                }
            });

            return {
                movie,
                score,
            };
        })

        .filter((item) => item.score > 0)

        .sort((a, b) => b.score - a.score)

        .map((item) => item.movie)

        .slice(0, 10);
}

/* =========================================================
   SEARCH
========================================================= */

async function performSearch(query) {
    query = query.trim();

    if (!query) {
        return;
    }

    showLoading();

    try {
        /*
            ===============================================
            TEMPORARY MOCK SEARCH
            ===============================================

            Later replace this block with:

            const response = await fetch(
                "http://localhost:8000/api/query",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        query
                    })
                }
            );

            const data = await response.json();

        */

        await sleep(700);

        const localResults = searchMoviesLocally(query);

        showSearchResults(query, localResults);
    } catch (error) {
        console.error('Search failed:', error);

        searchAnswer.classList.remove('hidden');

        searchAnswer.textContent = 'Something went wrong while searching.';
    } finally {
        hideLoading();
    }
}

/* =========================================================
   LOCAL SEARCH
========================================================= */

function searchMoviesLocally(query) {
    const q = query.toLowerCase();

    return movies.filter((movie) => {
        const searchableText = [
            movie.movie.title,

            movie.movie.year,

            movie.director?.name,

            ...(movie.actors || []),

            ...(movie.genres || []),

            ...(movie.themes || []),
        ]
            .join(' ')
            .toLowerCase();

        return searchableText.includes(q);
    });
}

/* =========================================================
   SHOW SEARCH RESULTS
========================================================= */

function showSearchResults(query, results) {
    homeView.classList.add('hidden');

    movieView.classList.add('hidden');

    searchView.classList.remove('hidden');

    searchQueryText.textContent = `"${query}"`;

    searchAnswer.classList.add('hidden');

    renderMovies(results, searchResults);

    window.scrollTo({
        top: 0,
        behavior: 'smooth',
    });
}

/* =========================================================
   BACK BUTTON
========================================================= */

document.getElementById('backButton').addEventListener('click', () => {
    movieView.classList.add('hidden');

    homeView.classList.remove('hidden');

    window.scrollTo({
        top: 0,
        behavior: 'smooth',
    });
});

document.getElementById('backFromSearch').addEventListener('click', () => {
    searchView.classList.add('hidden');

    homeView.classList.remove('hidden');

    window.scrollTo({
        top: 0,
        behavior: 'smooth',
    });
});

/* =========================================================
   SEARCH BUTTON
========================================================= */

searchButton.addEventListener('click', () => {
    performSearch(searchInput.value);
});

/* =========================================================
   ENTER KEY
========================================================= */

searchInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        performSearch(searchInput.value);
    }
});

/* =========================================================
   SEARCH SUGGESTIONS
========================================================= */

document.querySelectorAll('.suggestion').forEach((button) => {
    button.addEventListener('click', () => {
        searchInput.value = button.textContent.trim();

        performSearch(searchInput.value);
    });
});

/* =========================================================
   HELPERS
========================================================= */

function getPosterLetter(title) {
    return title.trim().charAt(0).toUpperCase();
}

function formatAward(award) {
    if (typeof award === 'string') {
        return award;
    }

    if (award.category) {
        return `${award.name} — ${award.category}`;
    }

    return award.name || 'Award';
}

function escapeHTML(value) {
    return String(value)
        .replace(/&/g, '&amp;')

        .replace(/</g, '&lt;')

        .replace(/>/g, '&gt;')

        .replace(/"/g, '&quot;')

        .replace(/'/g, '&#039;');
}

function showLoading() {
    loading.classList.remove('hidden');
}

function hideLoading() {
    loading.classList.add('hidden');
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
