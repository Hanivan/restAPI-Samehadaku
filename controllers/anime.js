import fetch from "node-fetch";
import dotenv from "dotenv";
import cheerio from "cheerio";
import {
  fetchAllAnime,
  getDetailAnime,
  getPagination,
  log,
  zippyGetLink,
} from "../helper/index.js";

dotenv.config();
const env = process.env;
const baseUrl = env.BASEURL;
const ongoing = `${baseUrl}${env.ONGOING_ANIME}`;
const schedule = `${baseUrl}${env.SCHEDULE}`;
const batch = `${baseUrl}${env.BATCH}`;
const movie = `${baseUrl}${env.MOVIE}`;
const studio = `${baseUrl}${env.STUDIO}`;
const producer = `${baseUrl}${env.PRODUCER}`;
const season = `${baseUrl}${env.SEASON}`;

export const home = async (req, res) => {
  try {
    const { content_name, anime_list } = await fetchAllAnime(baseUrl, "anime");

    res.status(200).json({
      status: "success",
      data_from: baseUrl,
      content_name,
      anime_list,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      error: `Somethink wrong from server`,
    });
  }
};

export const allAnime = async (req, res) => {
  const params = req.params.page;
  const page =
    typeof params === "undefined" ? "" : params === "1" ? "" : `page/${params}`;
  const fullUrl = `${baseUrl}anime/${page}`;
  const url = req.protocol + "s://" + req.get("host") + "/api/";

  try {
    const { content_name, anime_list } = await fetchAllAnime(fullUrl, "anime");
    const { prev_page, next_page, current_page } = await getPagination(
      fullUrl,
      url
    );

    res.status(200).json({
      status: "success",
      data_from: fullUrl,
      content_name,
      prev_page,
      next_page,
      current_page,
      anime_list,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      error: `Somethink wrong from server`,
    });
  }
};

export const detailAnime = async (req, res) => {
  const params = req.params.id;
  const fullUrl = `${baseUrl}anime/${params}`;

  try {
    const response = await fetch(fullUrl);
    const body = await response.text();
    const $ = cheerio.load(body);
    const element = $(".post-body");
    let episodeList = [];
    let animeObject = {};
    let title, id, link, uploaded_on;

    animeObject = await getDetailAnime(fullUrl, "anime");

    element
      .eq(0)
      .map(function () {
        $(this)
          .find(".widget_senction > .listeps > ul > li")
          .map(function () {
            title = $(this).find("div:nth-child(2) > .lchx > a ").text();
            id = $(this)
              .find("div:nth-child(2) > .lchx > a ")
              .attr("href")
              .replace(`${baseUrl}`, "");
            link = $(this).find("div:nth-child(2) > .lchx > a ").attr("href");
            uploaded_on = $(this).find("div:nth-child(2) > .date ").text();
            episodeList.push({
              title,
              id,
              link,
              uploaded_on,
            });
            animeObject.episode_list = episodeList; // || [], jadi if bisa dihapus
          });

        animeObject.batch_link = {
          id:
            $(this).find(".whites > .listbatch").text().length !== 0
              ? $(this)
                  .find(".whites > .listbatch > a")
                  .attr("href")
                  .replace(`${baseUrl}batch/`, "")
              : "Masih Kosong",
          link:
            $(this).find(".whites > .listbatch").text().length !== 0
              ? $(this).find(".whites > .listbatch > a").attr("href")
              : "Masih Kosong",
        };
        if (animeObject.episode_list === undefined) {
          animeObject.episode_list = [];
        }
      })
      .toArray();

    res.status(200).send(animeObject);
  } catch (e) {
    console.log(e);
    res.status(500).json({
      error: `Somethink wrong from server`,
    });
  }
};

export const ongoingAnime = async (req, res) => {
  const params = req.params.page;
  const page =
    typeof params === "undefined" ? "" : params === "1" ? "" : `page/${params}`;
  const fullUrl = `${ongoing}${page}`;
  const url = req.protocol + "s://" + req.get("host") + "/api/";

  try {
    const response = await fetch(fullUrl);
    const { prev_page, next_page, current_page } = await getPagination(
      fullUrl,
      url
    );
    const body = await response.text();
    const $ = cheerio.load(body);
    const element = $(".post-show");
    let animeList = [];
    let title, eps, thumb, author, release_on, id, link;

    element
      .eq(0)
      .find("li")
      .map(function () {
        title = $(this).find(".dtla > .entry-title > a").text();
        eps = $(this).find(".dtla > span:nth-child(2) > author").text();
        id = $(this)
          .find(".entry-title > a")
          .attr("href")
          .replace(`${baseUrl}`, "");
        thumb = ($(this).find(".thumb > a > .anmsa").attr("src") || "?").split(
          "?"
        )[0];
        author = $(this).find(".dtla > span:nth-child(3) > author").text();
        release_on = $(this)
          .find(".dtla > span:nth-child(4)")
          .text()
          .replace(" Released on: ", "");
        link = $(this).find(".entry-title > a").attr("href");
        animeList.push({
          title,
          eps,
          id,
          thumb,
          author,
          release_on,
          link,
        });
      })
      .toArray();

    res.status(200).json({
      status: "success",
      data_from: fullUrl,
      prev_page,
      next_page,
      current_page,
      anime_list: animeList,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      error: `Somethink wrong from server`,
    });
  }
};

export const animeSchedule = async (req, res) => {
  try {
    const response = await fetch(schedule);
    const body = await response.text();
    const $ = cheerio.load(body);
    const element = $(".pagess");
    let schedules = {};

    const day = element
      .eq(0)
      .find(".post-show .tab-dates")
      .map(function () {
        return $(this).text().trim();
      })
      .toArray();

    schedules.anime_list = element
      .eq(0)
      .find(".post-show > .result-schedule")
      .map(function (i) {
        return {
          day: day[i],
          anime_list: $(this)
            .find(".animepost")
            .map(function () {
              return {
                thumb: (
                  $(this)
                    .find(".animposx > a > .content-thumb > .anmsa")
                    .attr("src") || "?"
                ).split("?")[0],
                title: $(this)
                  .find(".animposx > a > .data > .title")
                  .text()
                  .trim(),
                id: $(this)
                  .find(".animposx > a")
                  .attr("href")
                  .replace(`${baseUrl}anime/`, ""),
                type: $(this)
                  .find(".animposx > a > .content-thumb > .type")
                  .text(),
                genre: $(this).find(".animposx > a > .data > .type").text(),
                score: parseFloat(
                  $(this)
                    .find(".animposx > a > .content-thumb > .score")
                    .text()
                    .trim() || null
                ),
                last_upload: $(this)
                  .find(".animposx > a > .data_tw > .ltseps")
                  .text(),
                link: $(this).find(".animposx > a").attr("href"),
              };
            })
            .toArray(),
        };
      })
      .toArray();

    res.status(200).json({
      status: "success",
      data_from: schedule,
      anime_schedule: schedules.anime_list,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      error: `Somethink wrong from server`,
    });
  }
};

export const allGenres = async (req, res) => {
  try {
    const response = await fetch(ongoing);
    const body = await response.text();
    const $ = cheerio.load(body);
    const element = $(".widgets");
    let genreList = [];
    let title, name, id, link, total;

    element
      .eq(0)
      .find(".genre li")
      .map(function () {
        title = $(this).find("a").attr("title");
        id = $(this).find("a").attr("href").replace(`${baseUrl}genre/`, "");
        link = $(this).find("a").attr("href");
        total = parseInt($(this).find("a > span").text() || 0);
        name = $(this).find("a").children().remove().end().text();
        genreList.push({
          title,
          name,
          id,
          link,
          total,
        });
      })
      .toArray();

    res.status(200).json({
      status: "success",
      data_from: ongoing,
      genre_list: genreList,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      error: `Somethink wrong from server`,
    });
  }
};

export const showGenre = async (req, res) => {
  const params = req.params.page;
  const id = req.params.id;
  const page =
    typeof params === "undefined" ? "" : params === "1" ? "" : `page/${params}`;
  const fullUrl = `${baseUrl}genre/${id}/${page}`;
  const url = req.protocol + "s://" + req.get("host") + "/api/";

  try {
    let { content_name, anime_list } = await fetchAllAnime(fullUrl, "anime");
    const { prev_page, next_page, current_page } = await getPagination(
      fullUrl,
      url
    );

    res.status(200).json({
      status: "success",
      data_from: fullUrl,
      content_name,
      prev_page,
      next_page,
      current_page,
      anime_list,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      error: `Somethink wrong from server`,
    });
  }
};

export const allBatch = async (req, res) => {
  const params = req.params.page;
  const page =
    typeof params === "undefined" ? "" : params === "1" ? "" : `page/${params}`;
  const fullUrl = `${batch}${page}`;
  const url = req.protocol + "s://" + req.get("host") + "/api/";

  try {
    const { content_name, anime_list } = await fetchAllAnime(fullUrl, "batch");
    const { prev_page, next_page, current_page } = await getPagination(
      fullUrl,
      url
    );

    res.status(200).json({
      status: "success",
      data_from: fullUrl,
      content_name,
      prev_page,
      next_page,
      current_page,
      anime_list,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      error: `Somethink wrong from server`,
    });
  }
};

export const detailBatch = async (req, res) => {
  const params = req.params.id;
  const fullUrl = `${baseUrl}batch/${params}`;

  try {
    const response = await fetch(fullUrl);
    const body = await response.text();
    const $ = cheerio.load(body);
    const element = $(".post-body");
    let genreList = [];
    let seasonList = [];
    let studioList = [];
    let producerList = [];
    let animeObject = {};
    let title,
      genre_name,
      genre_id,
      genre_link,
      season_name,
      season_id,
      season_link,
      studio_name,
      studio_id,
      studio_link,
      producer_name,
      producer_id,
      producer_link;

    element
      .eq(0)
      .map(function () {
        animeObject.data_from = `${fullUrl}`;
        animeObject.thumb = ($(this).find(".anmsa").attr("src") || "?").split(
          "?"
        )[0];
        animeObject.id = fullUrl.replace(`${baseUrl}batch/`, "");
        animeObject.synopsis = $(this).find(".entry-content").text();
        animeObject.title = $(this).find(".entry-title").text();

        /////////////////////////////////////////////////////////////////////////////////////////

        // liat ke helper
        for (let i = 1; i <= 13; i++) {
          $(this)
            .find(`.anim-senct > .right-senc > .infoanime > .infox > .spe`)
            .map(function () {
              let isContain = $(this).find(`span:nth-child(${i})`).text();

              isContain.match("Japanese") && animeObject.japanese === undefined
                ? (animeObject.japanese = isContain
                    .replace("Japanese ", "")
                    .trim())
                : "";

              isContain.match("English") && animeObject.english === ""
                ? (animeObject.english = isContain
                    .replace("English ", "")
                    .trim())
                : "";

              isContain.match("Type") && animeObject.type === ""
                ? (animeObject.type = $(this)
                    .find(`span:nth-child(${i})`)
                    .text()
                    .replace("Type ", "")
                    .trim())
                : "";

              isContain.match("Score") && animeObject.score === ""
                ? (animeObject.score = parseFloat(
                    $(this)
                      .find(`span:nth-child(${i})`)
                      .text()
                      .replace("Score ", "")
                      .trim()
                  ))
                : "";

              isContain.match("Duration") && animeObject.duration === ""
                ? (animeObject.duration = $(this)
                    .find(`span:nth-child(${i})`)
                    .text()
                    .replace("Duration ", "")
                    .trim())
                : "";

              isContain.match("Total Episode") &&
              animeObject.total_episode === "-"
                ? (animeObject.total_episode = $(this)
                    .find(`span:nth-child(${i})`)
                    .text()
                    .replace("Total Episode ", "")
                    .trim())
                : "";

              isContain.match("Genre") || animeObject.genre_list === undefined
                ? $(this)
                    .find(`span:nth-child(${i}) > a`)
                    .map(function () {
                      genre_name = $(this).text();
                      genre_id = $(this)
                        .attr("href")
                        .replace(`${baseUrl}genre/`, "");
                      genre_link = $(this).attr("href");
                      genreList.push({
                        genre_name,
                        genre_id,
                        genre_link,
                      });
                      animeObject.genre_list = genreList;
                    })
                : "";

              isContain.match("Season") || animeObject.season_list === undefined
                ? $(this)
                    .find(`span:nth-child(${i}) > a`)
                    .map(function () {
                      season_name = $(this).text();
                      season_id = $(this)
                        .attr("href")
                        .replace(`${baseUrl}season/`, "");
                      season_link = $(this).attr("href");
                      seasonList.push({
                        season_name,
                        season_id,
                        season_link,
                      });
                      animeObject.season_list = seasonList;
                    })
                : "";

              isContain.match("Producers") ||
              animeObject.producer_list === undefined
                ? $(this)
                    .find(`span:nth-child(${i}) > a`)
                    .map(function () {
                      producer_name = $(this).text();
                      producer_id = $(this)
                        .attr("href")
                        .replace(`${baseUrl}producers/`, "");
                      producer_link = $(this).attr("href");
                      producerList.push({
                        producer_name,
                        producer_id,
                        producer_link,
                      });
                      animeObject.producer_list = producerList;
                    })
                : "";

              isContain.match("Synonyms") && animeObject.synonym === ""
                ? (animeObject.synonym = $(this)
                    .find(`span:nth-child(${i})`)
                    .text()
                    .replace("Synonyms ", "")
                    .trim())
                : "";

              isContain.match("Status") && animeObject.status === ""
                ? (animeObject.status = $(this)
                    .find(`span:nth-child(${i})`)
                    .text()
                    .replace("Status ", "")
                    .trim())
                : "";

              isContain.match("Source") && animeObject.source === ""
                ? (animeObject.source = $(this)
                    .find(`span:nth-child(${i})`)
                    .text()
                    .replace("Source ", "")
                    .trim())
                : "";

              isContain.match("Studio") &&
              animeObject.studio_list[0] === undefined
                ? $(this)
                    .find(`span:nth-child(${i}) > a`)
                    .map(function () {
                      studio_name = $(this).text();
                      studio_id = $(this)
                        .attr("href")
                        .replace(`${baseUrl}studio/`, "");
                      studio_link = $(this).attr("href");
                      studioList.push({
                        studio_name,
                        studio_id,
                        studio_link,
                      });
                      animeObject.studio_list = studioList;
                    })
                : "";

              isContain.match("Rilis:") && animeObject.release_date === ""
                ? (animeObject.release_date = $(this)
                    .find(`span:nth-child(${i})`)
                    .text()
                    .replace("Rilis: ", "")
                    .trim())
                : "";

              if (animeObject.japanese === undefined) {
                animeObject.japanese = "";
              }
              if (animeObject.english === undefined) {
                animeObject.english = "";
              }
              if (animeObject.type === undefined) {
                animeObject.type = "";
              }
              if (animeObject.score === undefined) {
                animeObject.score = "";
              }
              if (animeObject.duration === undefined) {
                animeObject.duration = "";
              }
              if (animeObject.total_episode === undefined) {
                animeObject.total_episode = "-";
              }
              if (animeObject.genre_list === undefined) {
                animeObject.genre_list = [];
              }
              if (animeObject.season_list === undefined) {
                animeObject.season_list = [];
              }
              if (animeObject.producer_list === undefined) {
                animeObject.producer_list = [];
              }
              if (animeObject.synonym === undefined) {
                animeObject.synonym = "";
              }
              if (animeObject.status === undefined) {
                animeObject.status = "";
              }
              if (animeObject.source === undefined) {
                animeObject.source = "";
              }
              if (animeObject.studio_list === undefined) {
                animeObject.studio_list = [];
              }
              if (animeObject.release_date === undefined) {
                animeObject.release_date = "";
              }
              if (animeObject.download_list === undefined) {
                animeObject.download_list = [];
              }
            });
        }

        title = $(this)
          .find(".content-post > .download-eps")
          .map(function () {
            return $(this).find("p").text();
          })
          .toArray();

        animeObject.download_list = $(this)
          .find(".content-post > .download-eps")
          .map(function (i) {
            return {
              title: title[i],
              content: $(this)
                .find("ul li")
                .map(function () {
                  return {
                    quality: $(this).find("strong").text().trim(),
                    vendor: $(this)
                      .find("span")
                      .map(function () {
                        return {
                          name: $(this).find("a").text(),
                          link: $(this).find("a").attr("href"),
                        };
                      })
                      .toArray(),
                  };
                })
                .toArray(),
            };
          })
          .toArray();
      })
      .toArray();

    res.status(200).send(animeObject);
  } catch (e) {
    console.log(e);
    res.status(500).json({
      error: `Somethink wrong from server`,
    });
  }
};

export const showEpisode = async (req, res) => {
  const params = req.params.id;
  const fullUrl = `${baseUrl}${params}`;

  try {
    const response = await fetch(fullUrl);
    const body = await response.text();
    const $ = cheerio.load(body);
    const element = $(".player-area");
    let animeObject = {};
    let streamList = [];
    let title, low_quality, medium_quality, high_quality;

    // bypass zippyshare, ambil quality 360p, 480p, 720p aja
    low_quality =
      (await zippyGetLink(
        $(".infoeps .download-eps")
          .eq(0)
          .find("ul > li:nth-child(1) > span > a")
          .attr("href")
      )) || "#";
    medium_quality =
      (await zippyGetLink(
        $(".infoeps .download-eps")
          .eq(0)
          .find("ul > li:nth-child(2) > span > a")
          .attr("href")
      )) || "#";
    high_quality =
      (await zippyGetLink(
        $(".infoeps .download-eps")
          .eq(0)
          .find("ul > li:nth-child(3) > span > a")
          .attr("href")
      )) || "#";

    streamList.push({
      low_quality,
      medium_quality,
      high_quality,
    });

    element
      .eq(0)
      .map(function () {
        animeObject.status = "success";
        animeObject.data_from = fullUrl;
        animeObject.title = $(this).find(".entry-title").text();
        animeObject.current_episode = parseInt(
          $(this).find(".epx > span").text() || null
        );
        animeObject.release_date = $(this)
          .find(".epx > .time-post")
          .text()
          .trim();
      })
      .toArray();

    animeObject.stream_list = streamList;

    animeObject.prev_eps = (
      $(".naveps > div:nth-child(1) > a").attr("href") || "#"
    ).replace(`${baseUrl}`, ``);
    animeObject.next_eps = (
      $(".naveps > div:nth-child(3) > a").attr("href") || "#"
    ).replace(`${baseUrl}`, ``);
    animeObject.all_eps = (
      $(".naveps > div:nth-child(2) > a").attr("href") || "#"
    ).replace(`${baseUrl}anime/`, ``);

    title = $(".infoeps")
      .find(".download-eps")
      .map(function () {
        return $(this).find("p").text();
      })
      .toArray();

    animeObject.download_list = $(".infoeps")
      .find(".download-eps")
      .map(function (i) {
        return {
          title: title[i],
          content: $(this)
            .find("ul li")
            .map(function () {
              return {
                quality: $(this).find("strong").text().trim(),
                vendor: $(this)
                  .find("span")
                  .map(function () {
                    return {
                      name: $(this).find("a").text(),
                      link: $(this).find("a").attr("href"),
                    };
                  })
                  .toArray(),
              };
            })
            .toArray(),
        };
      })
      .toArray();

    res.status(200).send(animeObject);
  } catch (e) {
    console.log(e);
    res.status(500).json({
      error: `Somethink wrong from server`,
    });
  }
};

export const allAnimeMovie = async (req, res) => {
  const params = req.params.page;
  const page =
    typeof params === "undefined" ? "" : params === "1" ? "" : `page/${params}`;
  const fullUrl = `${movie}${page}`;

  try {
    const { content_name, anime_list } = await fetchAllAnime(fullUrl, "anime");

    res.status(200).json({
      status: "success",
      data_from: fullUrl,
      content_name,
      anime_list,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      error: `Somethink wrong from server`,
    });
  }
};

export const searchAnime = async (req, res) => {
  const query = req.params.id;
  const fullUrl = `${baseUrl}?s=${query}`;

  try {
    let { content_name, anime_list } = await fetchAllAnime(fullUrl, "anime");
    content_name = content_name.trim();

    res.status(200).json({
      status: "success",
      data_from: fullUrl,
      content_name,
      anime_list,
    });
  } catch (e) {
    res.status(500).json({
      error: `Somethink wrong from server`,
    });
  }
};

export const showStudio = async (req, res) => {
  const id = req.params.id;
  const params = req.params.page;
  const page =
    typeof params === "undefined" ? "" : params === "1" ? "" : `page/${params}`;
  const fullUrl = `${studio}${id}/${page}`;
  const url = req.protocol + "s://" + req.get("host") + "/api/";

  try {
    const { content_name, anime_list } = await fetchAllAnime(fullUrl, "anime");
    const { prev_page, next_page, current_page } = await getPagination(
      fullUrl,
      url
    );

    res.status(200).json({
      status: "success",
      data_from: fullUrl,
      content_name,
      prev_page,
      next_page,
      current_page,
      anime_list,
    });
  } catch (e) {
    res.status(500).json({
      error: `Somethink wrong from server`,
    });
  }
};

export const showProducer = async (req, res) => {
  const id = req.params.id;
  const params = req.params.page;
  const page =
    typeof params === "undefined" ? "" : params === "1" ? "" : `page/${params}`;
  const fullUrl = `${producer}${id}/${page}`;
  const url = req.protocol + "s://" + req.get("host") + "/api/";

  try {
    const { content_name, anime_list } = await fetchAllAnime(fullUrl, "anime");
    const { prev_page, next_page, current_page } = await getPagination(
      fullUrl,
      url
    );

    res.status(200).json({
      status: "success",
      data_from: fullUrl,
      content_name,
      prev_page,
      next_page,
      current_page,
      anime_list,
    });
  } catch (e) {
    res.status(500).json({
      error: `Somethink wrong from server`,
    });
  }
};

export const showSeason = async (req, res) => {
  const id = req.params.id;
  const params = req.params.page;
  const page =
    typeof params === "undefined" ? "" : params === "1" ? "" : `page/${params}`;
  const fullUrl = `${season}${id}/${page}`;

  try {
    const { content_name, anime_list } = await fetchAllAnime(fullUrl, "anime");

    res.status(200).json({
      status: "success",
      data_from: fullUrl,
      content_name,
      anime_list,
    });
  } catch (e) {
    res.status(500).json({
      error: `Somethink wrong from server`,
    });
  }
};
