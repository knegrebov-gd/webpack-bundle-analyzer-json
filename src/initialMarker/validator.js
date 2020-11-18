module.exports = class Validator {
  constructor({
    initialLoadingResources,
    maxInitialLoadingSizeSingle,
    maxInitialLoadingSizeBundle,
    chunksLoadingResources,
    maxLazyLoadingSizeSingle,
    maxLazyLoadingSizeBundle
  }) {
    this.initialLoadingResources = initialLoadingResources;
    this.maxInitialLoadingSizeSingle = maxInitialLoadingSizeSingle;
    this.maxInitialLoadingSizeBundle = maxInitialLoadingSizeBundle;
    this.chunksLoadingResources = chunksLoadingResources;
    this.maxLazyLoadingSizeSingle = maxLazyLoadingSizeSingle;
    this.maxLazyLoadingSizeBundle = maxLazyLoadingSizeBundle;
    this.errorsArray = [];
  }

  calculateMap(report) {
    let total;
    const sizes = report.reduce((acc, item) => {
      const name = item.chunkNames[0] || item.label;
      const size = item.gzipSizeInKB || item.gzipSize;
      acc[name] = size;
      if (!item.label.includes('css')) {
        total += size;
      }
      return acc;
    }, {});
    return { sizes, total };
  }

  checkInitial(report) {
    // Skip first empty run
    if (report.length === 0) {
      return report;
    }

    const { sizes, total } = this.calculateMap(report);

    if (total >= this.maxInitialLoadingSizeBundle) {
      this.errorsArray.push([
        'Initial Loaded Resource',
        'Total Bundle size',
        total - this.maxInitialLoadingSizeBundle
      ]);
    }

    this.initialLoadingResources.forEach((resource) => {
      const name = Array.isArray(resource) ? resource[0] : resource;
      const size = Array.isArray(resource)
        ? sizes[resource[0]]
        : sizes[resource];
      const limit = Array.isArray(resource)
        ? resource[1]
        : this.maxInitialLoadingSizeSingle;

      if (size >= limit) {
        this.errorsArray.push(['Initial Loaded Resource', name, size - limit]);
      }
    });

    return report;
  }

  checkChunks(report) {
    // Skip first empty run
    if (report.length === 0) {
      return report;
    }

    if (this.chunksLoadingResources.length) {
      const { sizes, total } = this.calculateMap(report);
      if (total >= this.maxLazyLoadingSizeBundle) {
        this.errorsArray.push([
          'Lazy chunk',
          'Total Bundle size',
          total - this.maxLazyLoadingSizeBundle
        ]);
      }

      this.chunksLoadingResources.forEach((resource) => {
        const name = Array.isArray(resource) ? resource[0] : resource;
        const size = Array.isArray(resource)
          ? sizes[resource[0]]
          : sizes[resource];
        const limit = Array.isArray(resource)
          ? resource[1]
          : this.maxLazyLoadingSizeSingle;
        if (size >= limit) {
          this.errorsArray.push(['Lazy chunk', name, size - limit]);
        }
      });
    } else {
      report.forEach((item) => {
        if (item.gzipSizeInKB >= this.maxLazyLoadingSizeSingle) {
          this.errorsArray.push([
            'Lazy chunk',
            item.chunkNames[0],
            item.gzipSizeInKB - this.maxLazyLoadingSizeSingle
          ]);
        }
      });
    }

    return report;
  }
};
