export namespace main {
	
	export class File {
	    basename: string;
	    absolute_path: string;
	    split_path: string[];
	
	    static createFrom(source: any = {}) {
	        return new File(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.basename = source["basename"];
	        this.absolute_path = source["absolute_path"];
	        this.split_path = source["split_path"];
	    }
	}

}

