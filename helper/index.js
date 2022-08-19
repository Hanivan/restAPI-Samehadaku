import fetch from "node-fetch";
import cheerio from "cheerio";
import dotenv from "dotenv";
import _url from "url";
import { evaluate } from "mathjs";

dotenv.config();
const env = process.env;
const baseUrl = env.BASEURL;

export const log = console.log;

// from "github.com/anasrar/Zippy-DL"
export const zippyGetLink = async (u) => {
  if (!String(u).includes("v") || !String(u).includes("zippyshare")) return "#";
  const zippy = await fetch(u);
  const body = await zippy.text();
  const $ = cheerio.load(body);
  let dlurl;
  const isContain = $("#lrbox > div > div:nth-child(2)").text().trim();
  if (
    isContain.match("File does not exist on this server") ||
    isContain.match(
      "File has expired and does not exist anymore on this server"
    )
  )
    return (dlurl = "#");
  const fileName = $(".center > div:nth-child(1) > font:nth-child(4)").text();
  const url = _url.parse($(".flagen").attr("href"), true);
  const urlori = _url.parse(u, true);
  const key = url.query["key"];
  const downloadKey1 = +$("#dlbutton").next().html().trim().match(/(\d+)/g)[0];
  const downloadKey2 = "asdasd".substr(0, 3).length;
  const seed = Math.pow(downloadKey1, 3) + downloadKey2;
  // const time =
  //   evaluate(/\(([\d\s\+\%]+?)\)/gm.exec($("#dlbutton").next().html())[1]) || 0;
  dlurl =
    urlori.protocol +
    "//" +
    urlori.hostname +
    "/d/" +
    key +
    "/" +
    seed +
    "/" +
    fileName;

  return dlurl;
};

export const getPagination = async (u, host) => {
  try {
    const response = await fetch(u);
    const body = await response.text();
    const $ = cheerio.load(body);
    let prev_page, next_page, current_page;

    current_page = $(".pagination")
      .find("span:nth-child(1)")
      .text()
      .replace("Page ", "");

    if ($(".pagination").find(".arrow_pag").length == 1) {
      next_page = (
        $(".pagination").find(".arrow_pag").attr("href") || "#"
      ).replace(`${baseUrl}`, `${host}`);
      prev_page = "#";
    } else {
      next_page = (
        $(".pagination").find(".arrow_pag").eq(1).attr("href") || "#"
      ).replace(`${baseUrl}`, `${host}`);
      prev_page = (
        $(".pagination").find(".arrow_pag").eq(0).attr("href") || "#"
      ).replace(`${baseUrl}`, `${host}`);
    }

    return { prev_page, next_page, current_page };
  } catch (e) {
    log(e.message);
  }
};

export const fetchAllAnime = async (u, replace) => {
  const response = await fetch(u);
  const body = await response.text();
  const $ = cheerio.load(body);
  const element = $(".relat");
  let animeList = [];
  let content_name, title, id, thumb, status, type, score, link;
  content_name = $(".widget_senction").eq(0).find(".widget-title").text();

  element
    .eq(0)
    .find(".animepost")
    .map(function () {
      title = $(this).find(".animposx > a > .data > .title").text().trim();
      id = $(this)
        .find(".animposx > a")
        .attr("href")
        .replace(`${baseUrl}${replace}/`, "");
      thumb = (
        $(this).find(".animposx > a > .content-thumb > .anmsa").attr("src") ||
        "?"
      ).split("?")[0];
      status = $(this).find(".animposx > a > .data > .type").text();
      type = $(this).find(".animposx > a > .content-thumb > .type").text();
      score = parseFloat(
        $(this).find(".animposx > a > .content-thumb > .score").text().trim() ||
          null
      );
      link = $(this).find(".animposx > a").attr("href");
      animeList.push({
        title,
        id,
        thumb,
        status,
        type,
        score,
        link,
      });
    })
    .toArray();

  return { anime_list: animeList, content_name };
};

export const getDetailAnime = async (u, replace) => {
  const response = await fetch(u);
  const body = await response.text();
  const $ = cheerio.load(body);
  const element = $(".post-body");
  let seasonList = [];
  let studioList = [];
  let producerList = [];
  let animeObject = {};
  let season_name,
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
      animeObject.data_from = `${u}`;
      animeObject.thumb = (
        $(this).find(".infoanime > .thumb > .anmsa").attr("src") || "?"
      ).split("?")[0];
      animeObject.id = u.replace(`${baseUrl}${replace}/`, "");
      animeObject.synopsis = $(this)
        .find(".infoanime > .infox > .desc > .entry-content")
        .text();
      animeObject.title = $(this)
        .find(".infoanime > .infox > .entry-title")
        .text();
      animeObject.score = parseFloat(
        $(this)
          .find(
            ".infoanime > .thumb > .rt > .rating-area > .rtg > .archiveanime-rating > span"
          )
          .text()
      );
      animeObject.rate = parseFloat(
        $(this)
          .find(
            ".infoanime > .thumb > .rt > .rating-area > .rtg > .archiveanime-rating > i"
          )
          .attr("content")
      );
      animeObject.genre_list = $(".infoanime > .infox > .genre-info > a")
        .map(function () {
          return {
            genre_name: $(this).text(),
            genre_id: $(this).attr("href").replace(`${baseUrl}genre/`, ""),
            genre_link: $(this).attr("href"),
          };
        })
        .toArray();

      /////////////////////////////////////////////////////////////////////////////////////////

      for (let i = 1; i <= 12; i++) {
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
              ? (animeObject.english = isContain.replace("English ", "").trim())
              : "";

            isContain.match("Type") && animeObject.type === ""
              ? (animeObject.type = $(this)
                  .find(`span:nth-child(${i})`)
                  .text()
                  .replace("Type ", "")
                  .trim())
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
            if (animeObject.duration === undefined) {
              animeObject.duration = "";
            }
            if (animeObject.total_episode === undefined) {
              animeObject.total_episode = "-";
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
          });
      }
    })
    .toArray();

  return animeObject;
};
