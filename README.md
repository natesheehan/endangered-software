![Repo Health](https://endangered-software.vercel.app//api/badge?owner=natesheehan&repo=endangered-software)

# Endangered software monitor
<p align="center">
  <img
    src="https://github.com/user-attachments/assets/10e5a5ff-64e2-448f-b172-da9cd978cc2f"
    alt="Logo"
    width="250"
    height="250"
  />
</p>

Endangered open software refers to open-source and openly distributed software projects whose continued development, maintenance, or availability is at risk, despite their ongoing use and significance. These risks are rarely the result of a single failure. More often, they emerge from the accumulation of mundane pressures such as limited maintainer time, unstable funding, technical debt, dependency fragility, and declining contributor communities. Over time, these ordinary conditions can undermine the sustainability of software that remains deeply embedded in research, industry, and public infrastructure.

## Not Another Open Software Health Tool?

*Agh, yikes!* Not another open software health tool!? That reaction is understandable. We have seen a steady stream of repository “health” projects come and go, including experiments like [repo-health-check](https://github.com/dogweather/repo-health-check), [edx-repo-health](https://github.com/openedx/edx-repo-health), and [repohealth.info](https://repohealth.info/). Many of these efforts were thoughtful and technically sound, yet they now sit largely unmaintained—becoming, ironically, examples of the fragility they were designed to diagnose.

Alongside these are a growing number of commercial analytics products, such as [Graphite’s repository analytics](https://graphite.com/guides/guide-to-github-repo-analytics). These tools offer polished insights into development workflows and team productivity. They are effective for managing active engineering teams, but they are typically scoped to GitHub, tuned to short-term activity, and oriented toward optimisation rather than long-term sustainability.

## Why the Red List?

This project starts from a simple observation: open software usually fails *slowly and quietly*. Maintenance burdens accumulate, governance structures thin out, dependencies harden, and platforms or institutions shift beneath a project’s feet.

In response, **the Red List of Endangered Software** focuses on long-term development trajectories rather than momentary signals. The first complete version of the Red List of Endangered Software is currently in development and is planned for release in 2026. At present, the project is focused on building a robust and reliable monitoring tool that can be applied at scale across a large corpus of open software repositories. Future phases of the work will also examine software ecosystems more broadly, including package managers, social and collaborative networks, and patterns of use in scientific research and industry.

## License

Apache 2.0 License. See [LICENSE](https://github.com/natesheehan/endangered-software?tab=Apache-2.0-1-ov-file#readme) for details.


## Contributing to the project

If you're seeing this, you've probably already done this step. Congrats!

```sh
# clone repo
git clone https://github.com/natesheehan/endangered-software.git

# enter folder
cd endangered-software
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```sh
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```sh
npm run build
```

You can preview the production build with `npm run preview`.


