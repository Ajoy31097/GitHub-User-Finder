$(document).ready(async function () {
    const urlParams = new URLSearchParams(window.location.search);
    const githubUsername = urlParams.get('username');

    const reposPerPage = 10;
    let currentPage = 1;
    let currentSet = 1;
    let totalPages, totalRepos, totalSets;

    const hideLoader = () => $('#spinningLoader').hide();
    const showContent = () => $('#content').removeClass('hidden');

    const fetchData = async (url, errorCallback) => {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to fetch: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            errorCallback(error);
        }
    };

    const fetchAndDisplayUser = async () => {
        try {
            const user = await fetchData(`https://api.github.com/users/${githubUsername}`, handleFetchError);
            updateUserInfo(user);
            totalRepos = user.public_repos;
            totalSets = Math.ceil(totalRepos / 100);
            console.log('totalRepos: ', totalRepos);
            await fetchAndDisplayRepos();
            showContent();
            hideLoader();
        } catch (error) {
            console.log(error);
        }
    };

    const fetchAndDisplayRepos = async () => {
        const startIndex = (currentPage - 1) * reposPerPage;
        const endIndex = startIndex + reposPerPage;

        try {
            const repos = await fetchData(`https://api.github.com/users/${githubUsername}/repos?per_page=100&page=${currentSet}`, handleFetchError);
            const repoList = $('#repoList');
            repoList.empty();

            const currentRepos = repos.slice(startIndex, endIndex);
            await Promise.all(currentRepos.map(repo => fetchAndDisplayRepo(repo)));
            updatePagination();
        } catch (error) {
            console.log(error);
        }
    };

    const fetchAndDisplayRepo = async (repo) => {
        const repoLanguages = await fetchData(repo.languages_url, handleFetchError);
        const repoItem = `<div class="repoItem p-2 m-4">
            <a href="${repo.html_url}" target="_blank" class="repoName my-2">${repo.name}  <i class="fa-solid fa-arrow-up-right-from-square"></i></a>
            <p class="my-2"> ${repo.description ? repo.description.slice(0, 128) + (repo.description.length > 128 ? ' . . .' : '') : 'No Description'}  </p>
            <div class="languageList">
                ${Object.keys(repoLanguages).map(language => `<div class="languageItem">${language}</div>`).join('\n')}
            </div>
        </div>`;
        $('#repoList').append(repoItem);
    };

    const updateUserInfo = (user) => {
        $('#profilePic').attr('src', user.avatar_url);
        $('#profileLink').attr('href', user.html_url);
        $('#profileLink').html(`<i class="fa fa-link" aria-hidden="true"></i> ${user.html_url}`);
        $('#userName').text(user.name || user.login);
        $('#userBio').text(user.bio || 'No bio available');
        $('#userLocation').html(`<i class="fa-solid fa-location-dot"></i> ${user.location || 'Not specified'}`);
        $('#userTwitter').html(`<i class="fa-brands fa-twitter"></i> ${user.twitter_username || 'Not specified'}`);
    };

    const updatePagination = () => {
        totalPages = Math.ceil(totalRepos / reposPerPage);

        const paginationButtons = $('#pagination .pageBtn');
        paginationButtons.empty();

        const addPaginationButton = (text, onclick, disabled = false) => {
            paginationButtons.append(`<button class="btn btn-secondary" onclick="${onclick}" ${disabled ? 'disabled' : ''}>${text}</button>`);
        };

        addPaginationButton('<<', 'prevPage', currentPage === 1);
        const startPage = (currentSet - 1) * 10 + 1;
        const endPage = Math.min(currentSet * 10, totalPages);
        for (let i = startPage; i <= endPage; i++) {
            const button = $(`<button class="btn" onclick="goToPage(${i})">${i}</button>`);
            if (i === (10 * (currentSet - 1) + currentPage)) {
                button.addClass('btn-secondary');
            }
            paginationButtons.append(button);
        }
        addPaginationButton('>>', 'nextPage', (currentSet === totalSets && currentPage === totalPages % 10) || currentPage === 10);

        $('#pagination .pageOtherItems').html(`
            <button class="btn btn-secondary" ${currentSet === 1 ? 'disabled' : ''} onclick="prevSet()"><i class="fa-solid fa-arrow-left"></i> Older</button>
            <button class="btn btn-secondary" ${currentSet === totalSets ? 'disabled' : ''} onclick="nextSet()">Newer <i class="fa-solid fa-arrow-right"></i></button>`);
    };

    window.goToPage = (page) => {
        currentPage = page === 10 ? 10 : page % 10;
        fetchAndDisplayRepos();
    };

    window.prevSet = () => {
        if (currentSet > 1) {
            currentSet--;
            currentPage = 1;
            fetchAndDisplayRepos();
        }
    };

    window.nextSet = () => {
        if (currentSet < totalSets) {
            currentSet++;
            currentPage = 1;
            fetchAndDisplayRepos();
        }
    };

    window.prevPage = () => {
        if (currentPage > 1) {
            currentPage--;
            fetchAndDisplayRepos();
        }
    };

    window.nextPage = () => {
        if (currentPage < 10) {
            currentPage++;
            fetchAndDisplayRepos();
        }
    };

    const handleFetchError = (error) => {
        if (error instanceof Error) {
            console.error(error.message);
        } else {
            console.error('An error occurred during the fetch operation.');
        }
    };

    await fetchAndDisplayUser();
});
