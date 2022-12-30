
    dayjs.extend(window.dayjs_plugin_relativeTime)
    dayjs.extend(window.dayjs_plugin_updateLocale)
    dayjs.updateLocale('en', {
        relativeTime: {
          future: "in %s",
          past: "GO",
          s:  number=> number < 10 ? `0${number}"`:`${number}"`,
          m:  number=> number < 10 ? `0${number}"`:`${number}"`,
          mm: number=> number < 10 ? `0${number}'`:`${number}'`,
          h:  number=> number < 10 ? `0${number}h`:`${number}h`,
          hh:  number=> number < 10 ? `0${number}h`:`${number}h`,
        }
      })


export default function update_front(data_buff)
{
    const buses = document.getElementsByClassName("buses");
    const train = document.getElementsByClassName("train")[0].children;

    setInterval(() => {
        let current_time_train = dayjs(data_buff.train_renens[0].departure);
        let current_dom_train = train[0].children;
        console.log(data_buff.train_renens[0].departure.getTime() - Date.now())
        if (data_buff.train_renens[0].departure.getTime() - Date.now() < 12000)
            current_dom_train[0].classList.add("URGENT");
        else
            current_dom_train[0].classList.remove("URGENT");
       current_dom_train[0].textContent = current_time_train.fromNow().replace("in", "");
       current_dom_train[2].textContent = data_buff.train_renens[0].to;
       current_dom_train[1].children[0].src = `media/platform/Gleis-${data_buff.train_renens[0].platform}_g_fr.svg`
       current_dom_train[1].children[1].src = `https://ki-bahnhof-anywhere.app.sbb.ch/assets/templates/images/vmart/${data_buff.train_renens[0].category}${data_buff.train_renens[0].number || ""}.svg`

       let current_data_i = 1;
       for (let next_train of train[1].children)
       {

           let next_train_dom = next_train.children;
           let current_data = data_buff.train_renens[current_data_i];

           next_train_dom[0].textContent = dayjs(current_data.departure).format("HH:mm");
           next_train_dom[2].textContent = current_data.to;
           
           current_data_i++;
       }

/*         to: item.to,
        category: item.category,
        number: item.number,
        platform: item.stop.platform,
        departure: new Date(item.stop.prognosis.departure || item.stop.departure) */
    }, 1000);
}